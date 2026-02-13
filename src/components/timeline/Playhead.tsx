import { useCallback, useRef } from 'react'

interface PlayheadProps {
  containerWidth: number
  containerHeight: number
  pps: number
  scrollOffset: number
  currentTime: number
  onSeek: (timeSec: number) => void
}

export function Playhead({
  containerWidth,
  containerHeight,
  pps,
  scrollOffset,
  currentTime,
  onSeek,
}: PlayheadProps) {
  const isDragging = useRef(false)

  const playheadX = (currentTime - scrollOffset) * pps

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      const rect = (e.target as HTMLElement)
        .closest('[data-playhead-container]')
        ?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const newTime = Math.max(0, scrollOffset + x / pps)
      onSeek(newTime)
    },
    [scrollOffset, pps, onSeek],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  if (playheadX < 0 || playheadX > containerWidth) return null

  return (
    <div
      data-playhead-container
      className="pointer-events-none absolute inset-0"
    >
      {/* Playhead line */}
      <div
        className="pointer-events-auto absolute top-0 cursor-col-resize"
        style={{
          left: playheadX - 8,
          width: 16,
          height: containerHeight,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-red-500"
        />
        {/* Handle triangle */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #ef4444',
          }}
        />
      </div>
    </div>
  )
}
