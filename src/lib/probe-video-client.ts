import type { VideoMeta } from './types'
import { parseMp4CreationTime } from './parse-mp4-creation-time'

/**
 * Extract video metadata client-side using the browser's video element.
 * This gives us duration, dimensions, and basic info without ffprobe.
 */
export function probeVideoClient(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = async () => {
      const meta: VideoMeta = {
        duration: video.duration,
        fps: 30, // Browser can't reliably detect FPS; default to 30
        width: video.videoWidth,
        height: video.videoHeight,
        codec: file.type || 'video/mp4',
        fileSize: file.size,
        filePath: url,
      }

      try {
        const creationDate = await parseMp4CreationTime(file)
        if (creationDate) {
          meta.creationTime = creationDate.getTime() / 1000
        }
      } catch {
        // Metadata extraction is optional — silently ignore
      }

      resolve(meta)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = url
  })
}
