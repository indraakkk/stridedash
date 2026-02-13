import type { MetricKey } from './types'
import { DEFAULT_DAMPING } from './constants'

/**
 * Exponential smoothing engine for gauge values.
 * display += (target - display) * factor
 * factor closer to 1 = more responsive, closer to 0 = smoother
 */
export class GaugeDampingEngine {
  private currentValues: Map<string, number> = new Map()

  /** Get smoothed value for a metric */
  getDampedValue(
    key: string,
    targetValue: number,
    dampingFactor?: number,
  ): number {
    const factor = dampingFactor ?? DEFAULT_DAMPING[key as MetricKey] ?? 0.3
    const current = this.currentValues.get(key)

    if (current == null) {
      this.currentValues.set(key, targetValue)
      return targetValue
    }

    const smoothed = current + (targetValue - current) * factor
    this.currentValues.set(key, smoothed)
    return smoothed
  }

  /** Reset all tracked values */
  reset(): void {
    this.currentValues.clear()
  }

  /** Reset a specific metric */
  resetMetric(key: string): void {
    this.currentValues.delete(key)
  }
}
