import { IG_REELS_SAFE_ZONE } from '~/lib/constants'
import { useUiStore } from '~/stores/ui-store'

interface SafeZoneOverlayProps {
  containerWidth: number
  containerHeight: number
}

export function SafeZoneOverlay({
  containerWidth,
  containerHeight,
}: SafeZoneOverlayProps) {
  const showSafeZone = useUiStore((s) => s.showSafeZone)

  if (!showSafeZone) return null

  const sz = IG_REELS_SAFE_ZONE

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      {/* Safe area border */}
      <div
        className="absolute border border-dashed border-border/40"
        style={{
          top: sz.top * containerHeight,
          left: sz.left * containerWidth,
          right: sz.right * containerWidth,
          bottom: sz.bottom * containerHeight,
        }}
      />

      {/* Top danger zone */}
      {sz.top > 0 && (
        <div
          className="absolute left-0 top-0 w-full bg-amber-500/10"
          style={{ height: sz.top * containerHeight }}
        />
      )}

      {/* Bottom danger zone */}
      <div
        className="absolute bottom-0 left-0 w-full bg-amber-500/10"
        style={{ height: sz.bottom * containerHeight }}
      />

      {/* Right danger zone */}
      <div
        className="absolute right-0 top-0 h-full bg-amber-500/10"
        style={{ width: sz.right * containerWidth }}
      />
    </div>
  )
}
