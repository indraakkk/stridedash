import { useCallback, useEffect, useRef } from 'react'
import { drawGauge } from '~/lib/gauge-canvas'
import type { GaugeConfig } from '~/lib/types'

interface GaugeOverlayProps {
  config: GaugeConfig
  value: number
  /** Whether the gauge has live data (false = placeholder mode) */
  hasData: boolean
  /** Composition width in pixels */
  compWidth: number
  /** Composition height in pixels */
  compHeight: number
}

export function GaugeOverlay({
  config,
  value,
  hasData,
  compWidth,
  compHeight,
}: GaugeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const pixelWidth = Math.round(config.size.width * compWidth)
  const pixelHeight = Math.round(config.size.height * compHeight)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGauge(ctx, {
      value,
      minValue: config.minValue,
      maxValue: config.maxValue,
      label: config.label,
      unit: config.unit,
      colorZones: config.colorZones,
      width: pixelWidth,
      height: pixelHeight,
      style: config.style,
      hasData,
      metric: config.metric,
      gaugeId: config.id,
    })
  }, [value, hasData, config, pixelWidth, pixelHeight])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={pixelWidth}
      height={pixelHeight}
      style={{
        position: 'absolute',
        left: `${config.position.x * 100}%`,
        top: `${config.position.y * 100}%`,
        width: pixelWidth,
        height: pixelHeight,
      }}
    />
  )
}
