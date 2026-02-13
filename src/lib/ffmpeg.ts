import { execFile } from 'node:child_process'

export interface CompositeOptions {
  inputVideoPath: string
  overlayPath: string
  outputPath: string
  width: number
  height: number
}

/**
 * Composite source video + transparent overlay → final MP4.
 * H.264 High Profile, AAC 128kbps.
 */
export function compositeVideo(options: CompositeOptions): Promise<void> {
  const { inputVideoPath, overlayPath, outputPath, width, height } = options

  return new Promise((resolve, reject) => {
    execFile(
      'ffmpeg',
      [
        '-y', // overwrite
        '-i', inputVideoPath,
        '-i', overlayPath,
        '-filter_complex',
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[bg];[bg][1:v]overlay=0:0[out]`,
        '-map', '[out]',
        '-map', '0:a?', // optional audio
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-preset', 'medium',
        '-crf', '18',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        outputPath,
      ],
      { timeout: 600000 }, // 10 min max
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`FFmpeg composite failed: ${stderr || error.message}`))
          return
        }
        resolve()
      },
    )
  })
}

export interface FormatPreset {
  name: string
  width: number
  height: number
  maxDuration: number // seconds
}

export const FORMAT_PRESETS: FormatPreset[] = [
  { name: 'Instagram Reels', width: 1080, height: 1920, maxDuration: 90 },
  { name: 'Instagram Stories', width: 1080, height: 1920, maxDuration: 60 },
]
