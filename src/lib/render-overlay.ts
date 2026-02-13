/**
 * Client-side overlay rendering using canvas capture.
 * Renders gauge overlay frames to a MediaRecorder-based WebM.
 * This avoids needing @remotion/renderer + headless Chromium for Phase 1.
 *
 * For production quality, Phase 4 can upgrade to @remotion/renderer.
 */

import { drawGauge, type GaugeDrawConfig } from './gauge-canvas'
import { TimelineSyncEngine } from './timeline-sync'
import { GaugeDampingEngine } from './gauge-damping'
import { getMetricValue } from './metric-value'
import type { FitTimeline, GaugeConfig, TimelineSync } from './types'

export interface RenderProgress {
  currentFrame: number
  totalFrames: number
  phase: 'loading' | 'rendering' | 'encoding' | 'done'
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.005) return resolve()
    video.addEventListener('seeked', () => resolve(), { once: true })
    video.currentTime = time
  })
}

export async function renderOverlayToBlob(
  fitTimeline: FitTimeline,
  sync: TimelineSync,
  gauges: GaugeConfig[],
  width: number,
  height: number,
  fps: number,
  durationSec: number,
  onProgress?: (progress: RenderProgress) => void,
  videoSrc?: string | null,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const syncEngine = new TimelineSyncEngine(fitTimeline, sync)
  const dampingEngine = new GaugeDampingEngine()
  const totalFrames = Math.round(durationSec * fps)

  // Load video element if source provided
  let videoEl: HTMLVideoElement | null = null
  if (videoSrc) {
    onProgress?.({ currentFrame: 0, totalFrames, phase: 'loading' })
    videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.preload = 'auto'
    videoEl.playsInline = true
    videoEl.src = videoSrc
    await new Promise<void>((res, rej) => {
      videoEl!.oncanplaythrough = () => res()
      videoEl!.onerror = () => rej(new Error('Failed to load video'))
    })
  }

  // Codec fallback: VP9 → MP4 → WebM default
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm'

  // Use MediaRecorder to capture frames
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recordingDone = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start()

  // Render each frame
  for (let frame = 0; frame < totalFrames; frame++) {
    ctx.clearRect(0, 0, width, height)

    // Draw video frame if available
    if (videoEl) {
      const videoTime = frame / fps - (sync.videoStartOffset ?? 0)
      if (videoTime >= 0 && videoTime <= videoEl.duration) {
        await seekVideo(videoEl, videoTime)
        ctx.drawImage(videoEl, 0, 0, width, height)
      }
    }

    const record = syncEngine.getDataAtFrame(frame, fps)

    for (const gauge of gauges) {
      if (!gauge.visible) continue

      const rawValue = record != null ? getMetricValue(record, gauge.metric) : null
      if (rawValue == null) continue

      const dampedValue = dampingEngine.getDampedValue(
        gauge.id,
        rawValue,
        gauge.dampingFactor,
      )

      const gaugeW = Math.round(gauge.size.width * width)
      const gaugeH = Math.round(gauge.size.height * height)
      const gaugeX = Math.round(gauge.position.x * width)
      const gaugeY = Math.round(gauge.position.y * height)

      // Create offscreen canvas for this gauge
      const offscreen = document.createElement('canvas')
      offscreen.width = gaugeW
      offscreen.height = gaugeH
      const offCtx = offscreen.getContext('2d')!

      const drawConfig: GaugeDrawConfig = {
        value: dampedValue,
        minValue: gauge.minValue,
        maxValue: gauge.maxValue,
        label: gauge.label,
        unit: gauge.unit,
        colorZones: gauge.colorZones,
        width: gaugeW,
        height: gaugeH,
        style: gauge.style,
        metric: gauge.metric,
        gaugeId: gauge.id,
      }

      drawGauge(offCtx, drawConfig)
      ctx.drawImage(offscreen, gaugeX, gaugeY)
    }

    onProgress?.({
      currentFrame: frame,
      totalFrames,
      phase: 'rendering',
    })

    // Yield to keep UI responsive
    if (frame % 10 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  onProgress?.({
    currentFrame: totalFrames,
    totalFrames,
    phase: 'encoding',
  })

  recorder.stop()
  await recordingDone

  // Cleanup video element
  if (videoEl) {
    videoEl.src = ''
    videoEl.load()
  }

  onProgress?.({
    currentFrame: totalFrames,
    totalFrames,
    phase: 'done',
  })

  return new Blob(chunks, { type: mimeType })
}
