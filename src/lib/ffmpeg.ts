import { spawn } from 'node:child_process'

/**
 * Composite original video with a stream of transparent PNG overlay frames.
 * FFmpeg reads the original video as input 0 and PNG frames from stdin as input 1,
 * overlays them, and outputs H.264/AAC MP4 with faststart.
 */
export function compositeWithFrameStream(opts: {
  inputVideoPath: string
  outputPath: string
  width: number
  height: number
  fps: number
  frameStream: AsyncIterable<Buffer>
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', opts.inputVideoPath,
      '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(opts.fps), '-i', 'pipe:0',
      '-filter_complex', '[1:v]format=rgba[ovr];[0:v][ovr]overlay=0:0[out]',
      '-map', '[out]', '-map', '0:a?',
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '18',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
      opts.outputPath,
    ])

    let stderr = ''
    ffmpeg.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
      if (stderr.length > 2000) stderr = stderr.slice(-1000)
    })
    ffmpeg.on('error', reject)
    ffmpeg.on('close', (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`FFmpeg failed (${code}): ${stderr.slice(-500)}`))
    })

    // Ignore EPIPE — FFmpeg may close stdin before we finish writing;
    // the 'close' handler will report the real exit code.
    ffmpeg.stdin.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code !== 'EPIPE') reject(err)
    })

    // Pipe PNG frames from async generator to FFmpeg stdin with backpressure
    ;(async () => {
      for await (const png of opts.frameStream) {
        if (!ffmpeg.stdin.write(png)) {
          await new Promise<void>((r) => ffmpeg.stdin.once('drain', r))
        }
      }
      ffmpeg.stdin.end()
    })().catch(reject)
  })
}
