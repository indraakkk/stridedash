import type { GaugeConfig, GaugePosition, SnapGuide } from './types'

const SNAP_THRESHOLD = 0.015 // ~16px at 1080px width

interface SnapResult {
  position: GaugePosition
  guides: SnapGuide[]
}

/**
 * Apply snap guides to a position based on grid lines and other gauges.
 */
export function applySnapGuides(
  pos: GaugePosition,
  gaugeSize: { width: number; height: number },
  otherGauges: GaugeConfig[],
  threshold = SNAP_THRESHOLD,
): SnapResult {
  let { x, y } = pos
  const guides: SnapGuide[] = []

  const gaugeCenterX = x + gaugeSize.width / 2
  const gaugeCenterY = y + gaugeSize.height / 2

  // Snap to center of frame
  if (Math.abs(gaugeCenterX - 0.5) < threshold) {
    x = 0.5 - gaugeSize.width / 2
    guides.push({ axis: 'x', position: 0.5 })
  }
  if (Math.abs(gaugeCenterY - 0.5) < threshold) {
    y = 0.5 - gaugeSize.height / 2
    guides.push({ axis: 'y', position: 0.5 })
  }

  // Snap to thirds grid
  for (const third of [1 / 3, 2 / 3]) {
    if (Math.abs(gaugeCenterX - third) < threshold) {
      x = third - gaugeSize.width / 2
      guides.push({ axis: 'x', position: third })
    }
    if (Math.abs(gaugeCenterY - third) < threshold) {
      y = third - gaugeSize.height / 2
      guides.push({ axis: 'y', position: third })
    }
  }

  // Snap to other gauge edges
  for (const other of otherGauges) {
    const otherCenterX = other.position.x + other.size.width / 2
    const otherCenterY = other.position.y + other.size.height / 2

    // Align center X with other gauge center
    if (Math.abs(gaugeCenterX - otherCenterX) < threshold) {
      x = otherCenterX - gaugeSize.width / 2
      guides.push({ axis: 'x', position: otherCenterX })
    }

    // Align center Y with other gauge center
    if (Math.abs(gaugeCenterY - otherCenterY) < threshold) {
      y = otherCenterY - gaugeSize.height / 2
      guides.push({ axis: 'y', position: otherCenterY })
    }

    // Align left edge with other left edge
    if (Math.abs(x - other.position.x) < threshold) {
      x = other.position.x
      guides.push({ axis: 'x', position: other.position.x })
    }

    // Align top edge with other top edge
    if (Math.abs(y - other.position.y) < threshold) {
      y = other.position.y
      guides.push({ axis: 'y', position: other.position.y })
    }
  }

  return { position: { x, y }, guides }
}
