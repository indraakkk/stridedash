import type { GaugeConfig } from '~/lib/types'
import { IG_REELS_SAFE_ZONE } from '~/lib/constants'

interface DraggableGaugeHandleProps {
  gauge: GaugeConfig
  isSelected: boolean
  containerWidth: number
  containerHeight: number
}

function isInDangerZone(gauge: GaugeConfig): boolean {
  const { x, y } = gauge.position
  const { width, height } = gauge.size

  const right = x + width
  const bottom = y + height

  return (
    y < IG_REELS_SAFE_ZONE.top ||
    bottom > 1 - IG_REELS_SAFE_ZONE.bottom ||
    right > 1 - IG_REELS_SAFE_ZONE.right
  )
}

export function DraggableGaugeHandle({
  gauge,
  isSelected,
  containerWidth,
  containerHeight,
}: DraggableGaugeHandleProps) {
  const inDanger = isInDangerZone(gauge)

  const left = gauge.position.x * containerWidth
  const top = gauge.position.y * containerHeight
  const width = gauge.size.width * containerWidth
  const height = gauge.size.height * containerHeight

  return (
    <div
      data-gauge-id={gauge.id}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
      className={`
        rounded border-2 transition-colors
        ${isSelected ? 'border-primary' : 'border-transparent'}
        ${inDanger ? 'border-amber-500' : ''}
      `}
    >
      {/* Corner resize handle */}
      <div
        data-resize-handle={gauge.id}
        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-se-resize rounded-sm bg-primary opacity-0 transition-opacity hover:opacity-100"
        style={{ opacity: isSelected ? 1 : 0 }}
      />

      {/* Danger zone warning */}
      {inDanger && (
        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-black">
          !
        </div>
      )}
    </div>
  )
}
