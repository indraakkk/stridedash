import { useCallback, useRef } from 'react'
import { useProjectStore } from '~/stores/project-store'
import { useUiStore } from '~/stores/ui-store'
import { applySnapGuides } from '~/lib/snap-guides'
import { GAUGE_MIN_SIZE, GAUGE_MAX_SIZE } from '~/lib/constants'
import { DraggableGaugeHandle } from './DraggableGaugeHandle'

interface GaugeDragLayerProps {
  containerWidth: number
  containerHeight: number
}

export function GaugeDragLayer({
  containerWidth,
  containerHeight,
}: GaugeDragLayerProps) {
  const gauges = useProjectStore((s) => s.gauges)
  const updateGauge = useProjectStore((s) => s.updateGauge)
  const selectedGaugeId = useUiStore((s) => s.selectedGaugeId)
  const selectGauge = useUiStore((s) => s.selectGauge)
  const setDragging = useUiStore((s) => s.setDragging)
  const setResizing = useUiStore((s) => s.setResizing)
  const setActiveSnapGuides = useUiStore((s) => s.setActiveSnapGuides)

  const dragState = useRef<{
    gaugeId: string
    startX: number
    startY: number
    startPosX: number
    startPosY: number
    mode: 'drag' | 'resize'
    startWidth: number
    startHeight: number
  } | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement

      // Check if clicking a resize handle
      const resizeHandle = target.closest('[data-resize-handle]')
      const gaugeEl = target.closest('[data-gauge-id]')

      if (!gaugeEl && !resizeHandle) return

      const gaugeId =
        resizeHandle?.getAttribute('data-resize-handle') ??
        gaugeEl?.getAttribute('data-gauge-id')

      if (!gaugeId) return

      const gauge = gauges.find((g) => g.id === gaugeId)
      if (!gauge) return

      selectGauge(gaugeId)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

      const isResize = !!resizeHandle
      dragState.current = {
        gaugeId,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: gauge.position.x,
        startPosY: gauge.position.y,
        mode: isResize ? 'resize' : 'drag',
        startWidth: gauge.size.width,
        startHeight: gauge.size.height,
      }

      if (isResize) setResizing(true)
      else setDragging(true)
    },
    [gauges, selectGauge, setDragging, setResizing],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current
      if (!ds) return

      const dx = (e.clientX - ds.startX) / containerWidth
      const dy = (e.clientY - ds.startY) / containerHeight

      const gauge = gauges.find((g) => g.id === ds.gaugeId)
      if (!gauge) return

      if (ds.mode === 'drag') {
        const rawX = ds.startPosX + dx
        const rawY = ds.startPosY + dy

        const otherGauges = gauges.filter((g) => g.id !== ds.gaugeId)
        const { position, guides } = applySnapGuides(
          { x: rawX, y: rawY },
          gauge.size,
          otherGauges,
        )

        setActiveSnapGuides(guides)
        updateGauge(ds.gaugeId, { position })
      } else {
        // Resize mode
        const newWidth = Math.max(
          GAUGE_MIN_SIZE.width,
          Math.min(GAUGE_MAX_SIZE.width, ds.startWidth + dx),
        )
        const newHeight = Math.max(
          GAUGE_MIN_SIZE.height,
          Math.min(GAUGE_MAX_SIZE.height, ds.startHeight + dy),
        )
        updateGauge(ds.gaugeId, {
          size: { width: newWidth, height: newHeight },
        })
      }
    },
    [
      containerWidth,
      containerHeight,
      gauges,
      updateGauge,
      setActiveSnapGuides,
    ],
  )

  const handlePointerUp = useCallback(() => {
    dragState.current = null
    setDragging(false)
    setResizing(false)
    setActiveSnapGuides([])
  }, [setDragging, setResizing, setActiveSnapGuides])

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 10, pointerEvents: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {gauges
        .filter((g) => g.visible)
        .map((gauge) => (
          <DraggableGaugeHandle
            key={gauge.id}
            gauge={gauge}
            isSelected={gauge.id === selectedGaugeId}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
          />
        ))}
    </div>
  )
}
