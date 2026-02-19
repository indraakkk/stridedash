import {
  defineEventHandler,
  createError,
  setResponseHeader,
} from 'h3'
import { useStorage } from 'nitro/storage'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { renderGaugeFrames } from '~/lib/server/render-gauge-frames'
import { compositeWithFrameStream } from '~/lib/ffmpeg'

export default defineEventHandler(async (event) => {
  const formData = await event.req.formData()

  const videoFile = formData.get('video') as File | null
  const fitTimelineStr = formData.get('fitTimeline') as string | null
  const syncStr = formData.get('sync') as string | null
  const gaugesStr = formData.get('gauges') as string | null
  const videoMetaStr = formData.get('videoMeta') as string | null

  if (!videoFile || !fitTimelineStr || !syncStr || !gaugesStr || !videoMetaStr) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  let fitTimeline, sync, gauges, videoMeta
  try {
    fitTimeline = JSON.parse(fitTimelineStr)
    sync = JSON.parse(syncStr)
    gauges = JSON.parse(gaugesStr)
    videoMeta = JSON.parse(videoMetaStr)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid JSON in form fields' })
  }

  const width: number = videoMeta.width ?? 1080
  const height: number = videoMeta.height ?? 1920
  const fps: number = videoMeta.fps ?? 30

  // Load font from Nitro serverAssets
  let fontBuffer: Buffer | null = null
  try {
    const storage = useStorage('assets:fonts')
    const raw = await storage.getItemRaw('Inter-Regular.ttf')
    if (raw) fontBuffer = Buffer.from(raw as ArrayBuffer)
  } catch {
    // Font loading failed — gauges will use fallback font
  }

  const tmpDir = await mkdtemp(join(tmpdir(), 'stridash-'))

  try {
    const inputPath = join(tmpDir, 'input.mp4')
    const outputPath = join(tmpDir, 'output.mp4')
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    await writeFile(inputPath, videoBuffer)

    const frameStream = renderGaugeFrames({
      fitTimeline,
      sync,
      gauges,
      width,
      height,
      fps,
      durationSec: sync.videoDuration,
      fontBuffer,
    })

    await compositeWithFrameStream({
      inputVideoPath: inputPath,
      outputPath,
      width,
      height,
      fps,
      frameStream,
    })

    setResponseHeader(event, 'Content-Type', 'video/mp4')
    setResponseHeader(
      event,
      'Content-Disposition',
      'attachment; filename="stridash-export.mp4"',
    )

    const outputBuffer = await readFile(outputPath)
    return outputBuffer
  } finally {
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
})
