import { useCallback, useEffect, useRef, useState } from 'react'
import { TimelineCanvas } from './TimelineCanvas'
import { usePlaybackStore } from '~/stores/playback-store'
import { useProjectStore } from '~/stores/project-store'
import { Button } from '~/components/ui/button'

const TIMELINE_HEIGHT = 140

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [scrollOffset, setScrollOffset] = useState(0)
  const setFrame = usePlaybackStore((s) => s.setFrame)
  const fps = usePlaybackStore((s) => s.fps)
  const videoMeta = useProjectStore((s) => s.videoMeta)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)
  const sync = useProjectStore((s) => s.sync)
  const setSync = useProjectStore((s) => s.setSync)

  const handleSeek = useCallback(
    (timeSec: number) => {
      const newFrame = Math.round(timeSec * fps)
      setFrame(newFrame)
    },
    [fps, setFrame],
  )

  const handleFitToView = useCallback(() => {
    const duration = videoMeta?.duration ?? 60
    const containerWidth = containerRef.current?.clientWidth ?? 800
    const newZoom = containerWidth / (duration * 20) // 20 = BASE_PPS
    setZoom(Math.max(0.5, newZoom))
    setScrollOffset(0)
  }, [videoMeta])

  // FIT track drag state
  const fitDragRef = useRef<{ startX: number; startOffset: number } | null>(null)

  const handleFitDragStart = useCallback(
    (e: React.PointerEvent) => {
      // Check if clicking in FIT track area (rough y-coordinate check)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const relY = e.clientY - rect.top
      if (relY < 66 || relY > 126) return // FIT track area approx

      fitDragRef.current = {
        startX: e.clientX,
        startOffset: sync.fitStartOffset,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [sync.fitStartOffset],
  )

  const handleFitDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!fitDragRef.current) return
      const pps = 20 * zoom
      const dx = e.clientX - fitDragRef.current.startX
      const newOffset = fitDragRef.current.startOffset + dx / pps
      setSync({ fitStartOffset: newOffset })
    },
    [zoom, setSync],
  )

  const handleFitDragEnd = useCallback(() => {
    fitDragRef.current = null
  }, [])

  // Video track drag state
  const videoDragRef = useRef<{ startX: number; startOffset: number } | null>(null)

  const handleVideoDragStart = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const relY = e.clientY - rect.top
      // Account for toolbar height (~33px) — video track area is ruler(24) + gap(2) = 26..66
      const canvasY = relY - 33
      if (canvasY < 26 || canvasY > 66) return

      videoDragRef.current = {
        startX: e.clientX,
        startOffset: sync.videoStartOffset ?? 0,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [sync.videoStartOffset],
  )

  const handleVideoDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!videoDragRef.current) return
      const pps = 20 * zoom
      const dx = e.clientX - videoDragRef.current.startX
      const newOffset = videoDragRef.current.startOffset + dx / pps
      setSync({ videoStartOffset: newOffset })
    },
    [zoom, setSync],
  )

  const handleVideoDragEnd = useCallback(() => {
    videoDragRef.current = null
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Try video track first, then FIT track
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const canvasY = e.clientY - rect.top - 33
      if (canvasY >= 26 && canvasY <= 66) {
        handleVideoDragStart(e)
      } else {
        handleFitDragStart(e)
      }
    },
    [handleVideoDragStart, handleFitDragStart],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (videoDragRef.current) {
        handleVideoDragMove(e)
      } else {
        handleFitDragMove(e)
      }
    },
    [handleVideoDragMove, handleFitDragMove],
  )

  const handlePointerUp = useCallback(() => {
    handleVideoDragEnd()
    handleFitDragEnd()
  }, [handleVideoDragEnd, handleFitDragEnd])

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom((z) => Math.min(50, z * 1.3))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom((z) => Math.max(0.5, z / 1.3))
      } else if (e.key === '0') {
        e.preventDefault()
        handleFitToView()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleFitToView])

  if (!videoMeta && !fitTimeline) return null

  return (
    <div
      ref={containerRef}
      className="border-t border-border bg-card"
    >
      {/* Timeline toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="text-xs text-muted-foreground">Timeline</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.3))}
          className="h-6 w-6 p-0 text-xs"
        >
          −
        </Button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={Math.log(zoom / 0.5) / Math.log(100)}
          onChange={(e) => {
            const t = parseFloat(e.target.value)
            setZoom(0.5 * Math.pow(100, t))
          }}
          className="h-1 w-20 accent-foreground"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((z) => Math.min(50, z * 1.3))}
          className="h-6 w-6 p-0 text-xs"
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFitToView}
          className="h-6 text-xs"
        >
          Fit
        </Button>
        <span className="w-10 text-right text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Canvas area */}
      <div
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <TimelineCanvas
          width={containerRef.current?.clientWidth ?? 800}
          height={TIMELINE_HEIGHT}
          zoom={zoom}
          scrollOffset={scrollOffset}
          onScrollOffsetChange={setScrollOffset}
          onZoomChange={setZoom}
          onSeek={handleSeek}
        />
      </div>
    </div>
  )
}
