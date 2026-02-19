import type { ColorZone, GaugeStyle, MetricKey } from './types'

export interface GaugeDrawConfig {
  value: number
  minValue: number
  maxValue: number
  label: string
  unit: string
  colorZones: ColorZone[]
  width: number
  height: number
  style: GaugeStyle
  /** When false, draws placeholder with '--' instead of live value */
  hasData?: boolean
  /** Metric key for format dispatch (avoids fragile label string comparison) */
  metric?: MetricKey
  /** Unique gauge ID for sparkline history isolation */
  gaugeId?: string
  /** Per-request sparkline state (server isolation). Falls back to module global if omitted. */
  sparklineState?: Map<string, number[]>
}

/** roundRect polyfill for environments where ctx.roundRect is unavailable (e.g. @napi-rs/canvas) */
function roundRectPolyfill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | number[],
): void {
  const radii = typeof r === 'number' ? [r, r, r, r] : r
  const [tl, tr, br, bl] = radii
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
}

const TAU = Math.PI * 2
const BG_COLOR = 'rgba(0, 0, 0, 0.55)'
const NEEDLE_COLOR = '#ffffff'
const TRACK_COLOR = 'rgba(255, 255, 255, 0.1)'

function getActiveColor(value: number, colorZones: ColorZone[], maxValue: number): string {
  for (const zone of colorZones) {
    if (value >= zone.min && value < zone.max) return zone.color
  }
  if (value >= maxValue && colorZones.length > 0) {
    return colorZones[colorZones.length - 1].color
  }
  return '#ffffff'
}

function formatValue(value: number, metric?: MetricKey, label?: string): string {
  const isPace = metric === 'pace' || (!metric && label === 'Pace')
  if (isPace) {
    if (value <= 0 || !isFinite(value)) return '--:--'
    const mins = Math.floor(value)
    const secs = Math.round((value - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  return Math.round(value).toString()
}

/** Unified draw function — dispatches to style-specific renderer */
export function drawGauge(
  ctx: CanvasRenderingContext2D,
  config: GaugeDrawConfig,
): void {
  switch (config.style) {
    case 'arc':
      drawArcGauge(ctx, config)
      break
    case 'radial':
      drawRadialGauge(ctx, config)
      break
    case 'bar':
      drawBarGauge(ctx, config)
      break
    case 'minimal':
      drawMinimalGauge(ctx, config)
      break
  }
}

// ---- Arc Gauge (270° sweep) ----

function drawArcGauge(ctx: CanvasRenderingContext2D, config: GaugeDrawConfig): void {
  const { value, minValue, maxValue, label, unit, colorZones, width, height, hasData = true, metric } = config
  const ARC_SWEEP = (270 / 360) * TAU
  const ARC_START = Math.PI * 0.75

  const cx = width / 2
  const cy = height * 0.55
  const radius = Math.min(width, height) * 0.38
  const lineWidth = radius * 0.18
  const clampedValue = hasData ? Math.max(minValue, Math.min(maxValue, value)) : minValue
  const valueRatio = hasData ? (clampedValue - minValue) / (maxValue - minValue) : 0

  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = hasData ? 1 : 0.45

  // Background
  ctx.beginPath()
  ctx.arc(cx, cy, radius + lineWidth, 0, TAU)
  ctx.fillStyle = BG_COLOR
  ctx.fill()

  // Track
  ctx.beginPath()
  ctx.arc(cx, cy, radius, ARC_START, ARC_START + ARC_SWEEP)
  ctx.strokeStyle = TRACK_COLOR
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.stroke()

  // Color zone arcs
  for (const zone of colorZones) {
    const zoneStart = ((Math.max(zone.min, minValue) - minValue) / (maxValue - minValue)) * ARC_SWEEP
    const zoneEnd = ((Math.min(zone.max, maxValue) - minValue) / (maxValue - minValue)) * ARC_SWEEP
    if (zoneEnd <= 0 || zoneStart >= ARC_SWEEP) continue

    ctx.beginPath()
    ctx.arc(cx, cy, radius, ARC_START + Math.max(0, zoneStart), ARC_START + Math.min(ARC_SWEEP, zoneEnd))
    ctx.strokeStyle = zone.color + '40'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'butt'
    ctx.stroke()
  }

  // Filled arc (skip when no data)
  if (hasData && valueRatio > 0) {
    const valueAngle = ARC_START + valueRatio * ARC_SWEEP
    const activeColor = getActiveColor(clampedValue, colorZones, maxValue)

    ctx.beginPath()
    ctx.arc(cx, cy, radius, ARC_START, valueAngle)
    ctx.strokeStyle = activeColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    // Needle dot
    const needleX = cx + Math.cos(valueAngle) * radius
    const needleY = cy + Math.sin(valueAngle) * radius
    ctx.beginPath()
    ctx.arc(needleX, needleY, lineWidth * 0.35, 0, TAU)
    ctx.fillStyle = NEEDLE_COLOR
    ctx.fill()
  }

  // Center text
  const fontSize = Math.max(28, radius * 0.7)
  ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(hasData ? formatValue(value, metric, label) : '--', cx, cy - fontSize * 0.1)

  const smallFontSize = Math.max(14, radius * 0.28)
  ctx.font = `${smallFontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(`${label} · ${unit}`, cx, cy + fontSize * 0.6)

  ctx.globalAlpha = 1
}

// ---- Radial Gauge (full circle progress ring) ----

function drawRadialGauge(ctx: CanvasRenderingContext2D, config: GaugeDrawConfig): void {
  const { value, minValue, maxValue, label, unit, colorZones, width, height, hasData = true, metric } = config

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.4
  const lineWidth = radius * 0.15
  const clampedValue = hasData ? Math.max(minValue, Math.min(maxValue, value)) : minValue
  const valueRatio = hasData ? (clampedValue - minValue) / (maxValue - minValue) : 0

  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = hasData ? 1 : 0.45

  // Background circle
  ctx.beginPath()
  ctx.arc(cx, cy, radius + lineWidth * 0.5, 0, TAU)
  ctx.fillStyle = BG_COLOR
  ctx.fill()

  // Track ring
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.strokeStyle = TRACK_COLOR
  ctx.lineWidth = lineWidth
  ctx.stroke()

  // Progress ring (starts from top, -π/2)
  if (hasData && valueRatio > 0) {
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + valueRatio * TAU
    const activeColor = getActiveColor(clampedValue, colorZones, maxValue)

    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.strokeStyle = activeColor
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Center text
  const fontSize = Math.max(28, radius * 0.55)
  ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(hasData ? formatValue(value, metric, label) : '--', cx, cy - fontSize * 0.15)

  const smallFontSize = Math.max(14, radius * 0.22)
  ctx.font = `${smallFontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(`${label} · ${unit}`, cx, cy + fontSize * 0.5)

  ctx.globalAlpha = 1
}

// ---- Bar Gauge (vertical thermometer) ----

function drawBarGauge(ctx: CanvasRenderingContext2D, config: GaugeDrawConfig): void {
  const { value, minValue, maxValue, label, unit, colorZones, width, height, hasData = true, metric } = config

  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = hasData ? 1 : 0.45

  const padding = 8
  const barWidth = Math.min(width * 0.3, 30)
  const barX = width / 2 - barWidth / 2
  const barTop = padding + 20
  const barBottom = height - padding - 24
  const barHeight = barBottom - barTop

  const clampedValue = hasData ? Math.max(minValue, Math.min(maxValue, value)) : minValue
  const valueRatio = hasData ? (clampedValue - minValue) / (maxValue - minValue) : 0

  // Background
  roundRectPolyfill(ctx, 0, 0, width, height, 8)
  ctx.fillStyle = BG_COLOR
  ctx.fill()

  // Bar track
  roundRectPolyfill(ctx, barX, barTop, barWidth, barHeight, barWidth / 2)
  ctx.fillStyle = TRACK_COLOR
  ctx.fill()

  // Color zone fills (bottom to top)
  for (const zone of colorZones) {
    const zoneBottomRatio = (Math.max(zone.min, minValue) - minValue) / (maxValue - minValue)
    const zoneTopRatio = (Math.min(zone.max, maxValue) - minValue) / (maxValue - minValue)
    if (zoneTopRatio <= 0 || zoneBottomRatio >= 1) continue

    const yTop = barBottom - zoneTopRatio * barHeight
    const yBottom = barBottom - zoneBottomRatio * barHeight
    ctx.fillStyle = zone.color + '30'
    ctx.fillRect(barX, yTop, barWidth, yBottom - yTop)
  }

  // Filled bar (skip when no data)
  if (hasData && valueRatio > 0) {
    const fillHeight = valueRatio * barHeight
    const activeColor = getActiveColor(clampedValue, colorZones, maxValue)

    roundRectPolyfill(ctx, barX, barBottom - fillHeight, barWidth, fillHeight, barWidth / 2)
    ctx.fillStyle = activeColor
    ctx.fill()
  }

  // Value text (top)
  const fontSize = Math.max(28, width * 0.25)
  ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(hasData ? formatValue(value, metric, label) : '--', width / 2, 4)

  // Label (bottom)
  const smallFontSize = Math.max(12, width * 0.12)
  ctx.font = `${smallFontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${label}`, width / 2, height - 10)
  ctx.fillText(unit, width / 2, height - 2)

  ctx.globalAlpha = 1
}

// ---- Minimal Gauge (number + tiny sparkline) ----

// Ring buffer for sparkline history
const sparklineHistory = new Map<string, number[]>()
const SPARKLINE_LENGTH = 40

function drawMinimalGauge(ctx: CanvasRenderingContext2D, config: GaugeDrawConfig): void {
  const { value, label, unit, colorZones, width, height, hasData = true, metric, gaugeId } = config

  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = hasData ? 1 : 0.45

  // Background
  roundRectPolyfill(ctx, 0, 0, width, height, 6)
  ctx.fillStyle = BG_COLOR
  ctx.fill()

  // Track sparkline history (use gaugeId for isolation, fall back to label)
  const historyMap = config.sparklineState ?? sparklineHistory
  const key = gaugeId ? `${gaugeId}-sparkline` : `${label}-sparkline`
  if (hasData) {
    if (!historyMap.has(key)) historyMap.set(key, [])
    const history = historyMap.get(key)!
    history.push(value)
    if (history.length > SPARKLINE_LENGTH) history.shift()
  }
  const history = historyMap.get(key)

  // Value text
  const fontSize = Math.max(28, height * 0.45)
  ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(hasData ? formatValue(value, metric, label) : '--', 8, height * 0.38)

  // Label + unit
  const smallFontSize = Math.max(12, height * 0.18)
  ctx.font = `${smallFontSize}px Inter, system-ui, -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText(`${label} ${unit}`, 8, height * 0.72)

  // Sparkline (right side)
  if (history && history.length > 1) {
    const sparkX = width * 0.55
    const sparkW = width * 0.4
    const sparkY = 6
    const sparkH = height - 12

    let minV = Infinity
    let maxV = -Infinity
    for (const v of history) {
      minV = Math.min(minV, v)
      maxV = Math.max(maxV, v)
    }
    const range = maxV - minV || 1

    const activeColor = getActiveColor(value, colorZones, config.maxValue)

    ctx.beginPath()
    for (let i = 0; i < history.length; i++) {
      const x = sparkX + (i / (SPARKLINE_LENGTH - 1)) * sparkW
      const y = sparkY + sparkH - ((history[i] - minV) / range) * sparkH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = activeColor + '80'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

