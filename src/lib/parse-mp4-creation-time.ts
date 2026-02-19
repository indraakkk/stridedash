/**
 * Zero-dependency MP4 mvhd creation_time parser.
 * Reads the moov > mvhd box to extract the creation timestamp.
 *
 * Best-effort: only checks the first and last 64KB of the file.
 * Covers faststart (moov at head) and standard (moov at tail) layouts.
 * Will return null if moov is in the middle or spans a chunk boundary.
 */

const MAC_EPOCH_OFFSET = 2082844800 // seconds between 1904-01-01 and 1970-01-01
const CHUNK_SIZE = 64 * 1024 // 64KB

function findBox(data: DataView, name: string, start: number, end: number): number {
  const target =
    (name.charCodeAt(0) << 24) |
    (name.charCodeAt(1) << 16) |
    (name.charCodeAt(2) << 8) |
    name.charCodeAt(3)

  let offset = start
  while (offset + 8 <= end) {
    const size = data.getUint32(offset)
    const type = data.getInt32(offset + 4)
    if (size < 8) break
    if (type === target) return offset
    offset += size
  }
  return -1
}

function parseMvhd(data: DataView, moovOffset: number): Date | null {
  const moovSize = data.getUint32(moovOffset)
  const moovEnd = Math.min(moovOffset + moovSize, data.byteLength)
  const mvhdOffset = findBox(data, 'mvhd', moovOffset + 8, moovEnd)
  if (mvhdOffset === -1) return null

  const version = data.getUint8(mvhdOffset + 8)
  let creationTime: number

  if (version === 0) {
    creationTime = data.getUint32(mvhdOffset + 12)
  } else {
    // version 1: 64-bit creation_time at offset 12
    const hi = data.getUint32(mvhdOffset + 12)
    const lo = data.getUint32(mvhdOffset + 16)
    creationTime = hi * 0x100000000 + lo
  }

  if (creationTime === 0) return null
  const unixSeconds = creationTime - MAC_EPOCH_OFFSET
  if (unixSeconds < 0) return null

  return new Date(unixSeconds * 1000)
}

async function readChunk(file: File, start: number, size: number): Promise<DataView> {
  const end = Math.min(start + size, file.size)
  const slice = file.slice(start, end)
  const buffer = await slice.arrayBuffer()
  return new DataView(buffer)
}

export async function parseMp4CreationTime(file: File): Promise<Date | null> {
  // Try first 64KB (faststart MP4s have moov at the beginning)
  const head = await readChunk(file, 0, CHUNK_SIZE)
  let moovOffset = findBox(head, 'moov', 0, head.byteLength)

  if (moovOffset !== -1) {
    return parseMvhd(head, moovOffset)
  }

  // Try last 64KB (non-faststart MP4s)
  if (file.size > CHUNK_SIZE) {
    const tail = await readChunk(file, file.size - CHUNK_SIZE, CHUNK_SIZE)
    moovOffset = findBox(tail, 'moov', 0, tail.byteLength)
    if (moovOffset !== -1) {
      return parseMvhd(tail, moovOffset)
    }
  }

  return null
}
