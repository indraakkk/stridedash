import { useUiStore } from '~/stores/ui-store'

interface SnapGuideLinesProps {
  containerWidth: number
  containerHeight: number
}

export function SnapGuideLines({
  containerWidth,
  containerHeight,
}: SnapGuideLinesProps) {
  const guides = useUiStore((s) => s.activeSnapGuides)
  const isDragging = useUiStore((s) => s.isDragging)

  if (!isDragging || guides.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 15 }}>
      {guides.map((guide, i) =>
        guide.axis === 'x' ? (
          <div
            key={`x-${i}`}
            className="absolute top-0 h-full w-px bg-primary/60"
            style={{ left: guide.position * containerWidth }}
          />
        ) : (
          <div
            key={`y-${i}`}
            className="absolute left-0 h-px w-full bg-primary/60"
            style={{ top: guide.position * containerHeight }}
          />
        ),
      )}
    </div>
  )
}
