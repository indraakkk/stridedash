import { Sequence, useCurrentFrame, useVideoConfig, Video } from 'remotion'
import { useMemo, useRef } from 'react'
import { TimelineSyncEngine } from '~/lib/timeline-sync'
import { GaugeDampingEngine } from '~/lib/gauge-damping'
import { getMetricValue } from '~/lib/metric-value'
import { GaugeOverlay } from './GaugeOverlay'
import type { FitTimeline, GaugeConfig, MetricKey, TimelineSync } from '~/lib/types'

interface RunOverlayProps {
  fitTimeline: FitTimeline | null
  sync: TimelineSync
  gauges: GaugeConfig[]
  videoSrc: string | null
}

/** Generates smooth oscillating demo values when no FIT data is loaded. */
function getDemoValue(metric: MetricKey, frame: number, fps: number): number {
  const t = frame / fps // seconds
  switch (metric) {
    case 'heartRate':
      return 140 + 30 * Math.sin(t * 0.3) + 10 * Math.sin(t * 0.7)
    case 'pace':
      return 5.0 + 1.5 * Math.sin(t * 0.2) + 0.5 * Math.cos(t * 0.5)
    case 'cadence':
      return 170 + 15 * Math.sin(t * 0.4) + 5 * Math.cos(t * 0.9)
    case 'power':
      return 250 + 80 * Math.sin(t * 0.25) + 30 * Math.cos(t * 0.6)
    default:
      return 0
  }
}

export function RunOverlay({ fitTimeline, sync, gauges, videoSrc }: RunOverlayProps) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  const syncEngine = useMemo(
    () => fitTimeline ? new TimelineSyncEngine(fitTimeline, sync) : null,
    [fitTimeline, sync],
  )

  const dampingEngine = useRef(new GaugeDampingEngine()).current

  const record = syncEngine?.getDataAtFrame(frame, fps) ?? null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {videoSrc && (
        <Sequence from={Math.round((sync.videoStartOffset ?? 0) * fps)}>
          <Video
            src={videoSrc}
            style={{
              position: 'absolute',
              width,
              height,
              objectFit: 'cover',
            }}
          />
        </Sequence>
      )}
      {gauges
        .filter((g) => g.visible)
        .map((gauge) => {
          const rawValue =
            record != null ? getMetricValue(record, gauge.metric) : null

          // Use demo data when no FIT record available
          const hasData = rawValue != null
          const displayValue = hasData
            ? dampingEngine.getDampedValue(gauge.id, rawValue, gauge.dampingFactor)
            : getDemoValue(gauge.metric, frame, fps)

          return (
            <GaugeOverlay
              key={gauge.id}
              config={gauge}
              value={displayValue}
              hasData={hasData}
              compWidth={width}
              compHeight={height}
            />
          )
        })}
    </div>
  )
}
