import type { VideoMeta } from './types'

/**
 * Extract video metadata client-side using the browser's video element.
 * This gives us duration, dimensions, and basic info without ffprobe.
 */
export function probeVideoClient(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const meta: VideoMeta = {
        duration: video.duration,
        fps: 30, // Browser can't reliably detect FPS; default to 30
        width: video.videoWidth,
        height: video.videoHeight,
        codec: file.type || 'video/mp4',
        fileSize: file.size,
        filePath: url,
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
