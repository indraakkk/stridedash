import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import { drawGauge } from '~/lib/gauge-canvas'
import { TimelineSyncEngine } from '~/lib/timeline-sync'
import { GaugeDampingEngine } from '~/lib/gauge-damping'
import { getMetricValue } from '~/lib/metric-value'
import type { FitTimeline, GaugeConfig, TimelineSync } from '~/lib/types'

let fontPromise: Promise<void> | null = null

/** Register Inter font. Accepts a Buffer to avoid coupling to Nitro globals. */
export function ensureFontRegistered(fontBuffer?: Buffer | null): Promise<void> {
  if (!fontPromise) {
    fontPromise = Promise.resolve().then(() => {
      if (fontBuffer) {
        GlobalFonts.register(Buffer.from(fontBuffer), 'Inter')
      }
    })
  }
  return fontPromise
}

export async function* renderGaugeFrames(opts: {
  fitTimeline: FitTimeline
  sync: TimelineSync
  gauges: GaugeConfig[]
  width: number
  height: number
  fps: number
  durationSec: number
  fontBuffer?: Buffer | null
}): AsyncGenerator<Buffer> {
  await ensureFontRegistered(opts.fontBuffer)

  const { fitTimeline, sync, gauges, width, height, fps, durationSec } = opts
  const syncEngine = new TimelineSyncEngine(fitTimeline, sync)
  const dampingEngine = new GaugeDampingEngine()
  const totalFrames = Math.round(durationSec * fps)
  const sparklineState = new Map<string, number[]>()

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Pre-allocate offscreen canvases per visible gauge (avoid N*frames allocations)
  const visibleGauges = gauges.filter((g) => g.visible)
  const offscreens = visibleGauges.map((gauge) => {
    const gW = Math.round(gauge.size.width * width)
    const gH = Math.round(gauge.size.height * height)
    return { gauge, gW, gH, canvas: createCanvas(gW, gH) }
  })

  for (let frame = 0; frame < totalFrames; frame++) {
    ctx.clearRect(0, 0, width, height)
    const record = syncEngine.getDataAtFrame(frame, fps)

    for (const { gauge, gW, gH, canvas: offscreen } of offscreens) {
      const rawValue = record ? getMetricValue(record, gauge.metric) : null
      if (rawValue == null) continue

      const dampedValue = dampingEngine.getDampedValue(
        gauge.id,
        rawValue,
        gauge.dampingFactor,
      )

      const offCtx = offscreen.getContext('2d')

      drawGauge(offCtx as unknown as CanvasRenderingContext2D, {
        value: dampedValue,
        minValue: gauge.minValue,
        maxValue: gauge.maxValue,
        label: gauge.label,
        unit: gauge.unit,
        colorZones: gauge.colorZones,
        width: gW,
        height: gH,
        style: gauge.style,
        metric: gauge.metric,
        gaugeId: gauge.id,
        sparklineState,
      })

      ctx.drawImage(
        offscreen as any,
        Math.round(gauge.position.x * width),
        Math.round(gauge.position.y * height),
      )
    }

    yield canvas.toBuffer('image/png')
  }
}
