import type { MetricKey } from './types'

/** Shared metric extraction — used by both preview (RunOverlay) and export (render-overlay). */
export function getMetricValue(
  record: Record<string, any>,
  metric: MetricKey,
): number | null {
  switch (metric) {
    case 'heartRate':
      return record.heartRate ?? null
    case 'pace': {
      const speed = record.speed ?? null
      if (speed == null || speed <= 0) return null
      return 1000 / (speed * 60) // m/s → min/km
    }
    case 'cadence':
      return record.cadence ?? null
    case 'power':
      return record.power ?? null
    default:
      return null
  }
}
