import type { SafeZone, ColorZone, GaugePreset, MetricKey } from './types'

// Instagram Reels safe zone (fractions of frame)
export const IG_REELS_SAFE_ZONE: SafeZone = {
  top: 0.023, // ~44px at 1920h — status bar / dynamic island
  bottom: 0.27, // ~518px at 1920h — caption / CTA area
  left: 0, // no left danger zone
  right: 0.14, // ~151px at 1080w — like/comment/share buttons
}

// Damping factors per metric (0 = no smoothing, 1 = instant)
export const DEFAULT_DAMPING: Record<MetricKey, number> = {
  heartRate: 0.3,
  pace: 0.15,
  cadence: 0.5,
  power: 0.2,
}

// Color zones per metric
export const HR_ZONES: ColorZone[] = [
  { min: 0, max: 120, color: '#3b82f6' }, // blue — easy
  { min: 120, max: 150, color: '#22c55e' }, // green — aerobic
  { min: 150, max: 170, color: '#eab308' }, // yellow — threshold
  { min: 170, max: 220, color: '#ef4444' }, // red — max
]

export const PACE_ZONES: ColorZone[] = [
  { min: 0, max: 4.0, color: '#ef4444' }, // red — sprint (min/km)
  { min: 4.0, max: 5.0, color: '#eab308' }, // yellow — tempo
  { min: 5.0, max: 6.0, color: '#22c55e' }, // green — easy
  { min: 6.0, max: 10.0, color: '#3b82f6' }, // blue — recovery
]

export const CADENCE_ZONES: ColorZone[] = [
  { min: 0, max: 160, color: '#3b82f6' }, // blue — low
  { min: 160, max: 175, color: '#22c55e' }, // green — optimal
  { min: 175, max: 190, color: '#eab308' }, // yellow — high
  { min: 190, max: 240, color: '#ef4444' }, // red — very high
]

export const POWER_ZONES: ColorZone[] = [
  { min: 0, max: 200, color: '#3b82f6' }, // blue — easy
  { min: 200, max: 300, color: '#22c55e' }, // green — moderate
  { min: 300, max: 400, color: '#eab308' }, // yellow — hard
  { min: 400, max: 600, color: '#ef4444' }, // red — max
]

export const COLOR_ZONES_BY_METRIC: Record<MetricKey, ColorZone[]> = {
  heartRate: HR_ZONES,
  pace: PACE_ZONES,
  cadence: CADENCE_ZONES,
  power: POWER_ZONES,
}

// Metric display config
export const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; min: number; max: number }
> = {
  heartRate: { label: 'HR', unit: 'bpm', min: 60, max: 220 },
  pace: { label: 'Pace', unit: 'min/km', min: 2, max: 10 },
  cadence: { label: 'Cadence', unit: 'spm', min: 120, max: 240 },
  power: { label: 'Power', unit: 'W', min: 0, max: 600 },
}

// Default gauge size (normalized)
export const DEFAULT_GAUGE_SIZE = { width: 0.20, height: 0.11 }

// Gauge size constraints (normalized)
export const GAUGE_MIN_SIZE = { width: 0.08, height: 0.045 }
export const GAUGE_MAX_SIZE = { width: 0.4, height: 0.22 }

/** Build a preset gauge entry from metric + position, deriving all other fields from shared constants. */
function presetGauge(
  metric: MetricKey,
  position: { x: number; y: number },
  overrides?: { size?: { width: number; height: number }; style?: 'arc' | 'radial' | 'bar' | 'minimal' },
): Omit<GaugePreset['gauges'][number], never> {
  const cfg = METRIC_CONFIG[metric]
  return {
    metric,
    position,
    size: overrides?.size ?? DEFAULT_GAUGE_SIZE,
    visible: true,
    style: overrides?.style ?? 'arc',
    colorZones: COLOR_ZONES_BY_METRIC[metric],
    dampingFactor: DEFAULT_DAMPING[metric],
    label: cfg.label,
    unit: cfg.unit,
    minValue: cfg.min,
    maxValue: cfg.max,
  }
}

// Preset layouts
export const PRESETS: GaugePreset[] = [
  {
    id: 'runner-minimal',
    name: 'Runner Minimal',
    gauges: [
      presetGauge('heartRate', { x: 0.06, y: 0.06 }),
      presetGauge('pace', { x: 0.06, y: 0.19 }),
    ],
  },
  {
    id: 'full-dashboard',
    name: 'Full Dashboard',
    gauges: [
      presetGauge('heartRate', { x: 0.06, y: 0.06 }),
      presetGauge('pace', { x: 0.06, y: 0.19 }),
      presetGauge('cadence', { x: 0.06, y: 0.32 }),
      presetGauge('power', { x: 0.06, y: 0.45 }),
    ],
  },
  {
    id: 'hr-focus',
    name: 'HR Focus',
    gauges: [
      presetGauge('heartRate', { x: 0.06, y: 0.06 }, { size: { width: 0.28, height: 0.15 } }),
    ],
  },
]
