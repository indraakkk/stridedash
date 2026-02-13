import { useCallback, useEffect, useRef, useState } from 'react'
import { useProjectStore } from '~/stores/project-store'
import { usePlaybackStore } from '~/stores/playback-store'

interface TimelineCanvasProps {
  width: number
  height: number
  zoom: number
  scrollOffset: number
  onScrollOffsetChange: (offset: number) => void
  onZoomChange: (zoom: number) => void
  onSeek: (timeSec: number) => void
}

const RULER_HEIGHT = 24
const VIDEO_TRACK_HEIGHT = 40
const FIT_TRACK_HEIGHT = 60
const TRACK_GAP = 2

/** Pixels per second at zoom=1 */
const BASE_PPS = 20

export function TimelineCanvas({
  width,
  height,
  zoom,
  scrollOffset,
  onScrollOffsetChange,
  onZoomChange,
  onSeek,
}: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoMeta = useProjectStore((s) => s.videoMeta)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)
  const sync = useProjectStore((s) => s.sync)
  const frame = usePlaybackStore((s) => s.frame)
  const fps = usePlaybackStore((s) => s.fps)

  const pps = BASE_PPS * zoom // pixels per second

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const totalDuration = videoMeta?.duration ?? 60
    const currentTime = frame / fps

    // --- Ruler ---
    drawRuler(ctx, width, RULER_HEIGHT, pps, scrollOffset, totalDuration)

    // --- Video track ---
    const videoY = RULER_HEIGHT + TRACK_GAP
    drawVideoTrack(ctx, videoY, VIDEO_TRACK_HEIGHT, width, pps, scrollOffset, totalDuration, sync.videoStartOffset ?? 0)

    // --- FIT track ---
    const fitY = videoY + VIDEO_TRACK_HEIGHT + TRACK_GAP
    if (fitTimeline) {
      drawFitTrack(
        ctx,
        fitY,
        FIT_TRACK_HEIGHT,
        width,
        pps,
        scrollOffset,
        fitTimeline,
        sync.fitStartOffset,
        totalDuration,
      )
    }

    // --- Playhead ---
    const playheadX = (currentTime - scrollOffset) * pps
    if (playheadX >= 0 && playheadX <= width) {
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.stroke()

      // Playhead handle
      ctx.beginPath()
      ctx.moveTo(playheadX - 6, 0)
      ctx.lineTo(playheadX + 6, 0)
      ctx.lineTo(playheadX, 8)
      ctx.closePath()
      ctx.fillStyle = '#ef4444'
      ctx.fill()
    }
  }, [width, height, pps, scrollOffset, videoMeta, fitTimeline, sync, frame, fps])

  useEffect(() => {
    draw()
  }, [draw])

  // Handle wheel events for scroll + zoom (non-passive to allow preventDefault)
  const wheelRef = useRef({ zoom, scrollOffset, pps, onZoomChange, onScrollOffsetChange })
  wheelRef.current = { zoom, scrollOffset, pps, onZoomChange, onScrollOffsetChange }

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const { zoom, scrollOffset, pps, onZoomChange, onScrollOffsetChange } = wheelRef.current
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.pow(1.01, -e.deltaY)
        const newZoom = Math.max(0.5, Math.min(50, zoom * factor))
        onZoomChange(newZoom)
      } else {
        const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY
        const newOffset = Math.max(0, scrollOffset + scrollDelta / pps)
        onScrollOffsetChange(newOffset)
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Click to seek
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const timeSec = scrollOffset + x / pps
      onSeek(Math.max(0, timeSec))
    },
    [scrollOffset, pps, onSeek],
  )

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="cursor-crosshair"
      onClick={handleClick}
    />
  )
}

function drawRuler(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pps: number,
  scrollOffset: number,
  totalDuration: number,
) {
  ctx.fillStyle = '#2E2C26'
  ctx.fillRect(0, 0, width, height)

  // Determine tick interval based on zoom
  let tickInterval = 1
  if (pps < 5) tickInterval = 10
  else if (pps < 20) tickInterval = 5
  else if (pps < 50) tickInterval = 2
  else if (pps > 200) tickInterval = 0.5

  const startTime = Math.floor(scrollOffset / tickInterval) * tickInterval
  const endTime = Math.min(totalDuration, scrollOffset + width / pps)

  ctx.fillStyle = '#a9a59e'
  ctx.font = "10px 'Plus Jakarta Sans', system-ui"
  ctx.textAlign = 'center'

  for (let t = startTime; t <= endTime; t += tickInterval) {
    const x = (t - scrollOffset) * pps
    const isMajor = t % (tickInterval * 5) === 0 || tickInterval >= 5

    ctx.beginPath()
    ctx.moveTo(x, height)
    ctx.lineTo(x, isMajor ? height - 12 : height - 6)
    ctx.strokeStyle = '#5a5751'
    ctx.lineWidth = 1
    ctx.stroke()

    if (isMajor) {
      const mins = Math.floor(t / 60)
      const secs = Math.floor(t % 60)
      ctx.fillText(
        `${mins}:${secs.toString().padStart(2, '0')}`,
        x,
        height - 14,
      )
    }
  }
}

function drawVideoTrack(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  canvasWidth: number,
  pps: number,
  scrollOffset: number,
  duration: number,
  videoStartOffset: number,
) {
  // Track background
  ctx.fillStyle = '#3D4F5A'
  const startX = (videoStartOffset - scrollOffset) * pps
  const trackWidth = duration * pps
  const clippedStartX = Math.max(0, startX)
  const clippedWidth = Math.min(canvasWidth - clippedStartX, trackWidth - (clippedStartX - startX))
  if (clippedWidth <= 0) return
  ctx.fillRect(clippedStartX, y, clippedWidth, height)

  // Drag cursor hint
  ctx.strokeStyle = '#E2DECE40'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.strokeRect(clippedStartX, y, clippedWidth, height)
  ctx.setLineDash([])

  // Label
  ctx.fillStyle = '#E2DECE'
  ctx.font = "11px 'Plus Jakarta Sans', system-ui"
  ctx.textAlign = 'left'
  ctx.fillText('Video', clippedStartX + 6, y + height / 2 + 4)
}

function drawFitTrack(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  canvasWidth: number,
  pps: number,
  scrollOffset: number,
  fitTimeline: { records: { timestamp: number; heartRate?: number }[]; startTime: number; endTime: number },
  fitStartOffset: number,
  _totalDuration: number,
) {
  const fitDuration = fitTimeline.endTime - fitTimeline.startTime
  const fitStartX = (-scrollOffset + fitStartOffset) * pps
  const fitWidth = fitDuration * pps

  // Track background
  ctx.fillStyle = '#4a4d3d'
  ctx.fillRect(
    Math.max(0, fitStartX),
    y,
    Math.min(canvasWidth, fitWidth),
    height,
  )

  // HR waveform sparkline
  const records = fitTimeline.records
  if (records.length < 2) return

  // Find HR range
  let minHR = Infinity
  let maxHR = -Infinity
  for (const r of records) {
    if (r.heartRate != null) {
      minHR = Math.min(minHR, r.heartRate)
      maxHR = Math.max(maxHR, r.heartRate)
    }
  }
  if (minHR === Infinity) return

  const hrRange = maxHR - minHR || 1
  const padding = 4

  ctx.beginPath()
  let firstPoint = true

  for (const r of records) {
    if (r.heartRate == null) continue
    const relTime = r.timestamp - fitTimeline.startTime + fitStartOffset
    const x = (relTime - scrollOffset) * pps

    if (x < -10 || x > canvasWidth + 10) continue

    const normalizedHR = (r.heartRate - minHR) / hrRange
    const yPos = y + height - padding - normalizedHR * (height - padding * 2)

    if (firstPoint) {
      ctx.moveTo(x, yPos)
      firstPoint = false
    } else {
      ctx.lineTo(x, yPos)
    }
  }

  ctx.strokeStyle = '#73795Da0'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Label
  ctx.fillStyle = '#a9b08e'
  ctx.font = "11px 'Plus Jakarta Sans', system-ui"
  ctx.textAlign = 'left'
  ctx.fillText('FIT · HR', Math.max(6, fitStartX + 6), y + 14)
}
