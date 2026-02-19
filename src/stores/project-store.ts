import { create } from 'zustand'
import type {
  FitTimeline,
  GaugeConfig,
  MetricKey,
  ProjectState,
  TimelineSync,
  VideoMeta,
} from '~/lib/types'
import {
  COLOR_ZONES_BY_METRIC,
  DEFAULT_DAMPING,
  DEFAULT_GAUGE_SIZE,
  GAUGE_MAX_SIZE,
  GAUGE_MIN_SIZE,
  METRIC_CONFIG,
  PRESETS,
} from '~/lib/constants'

interface ProjectActions {
  setVideoMeta: (meta: VideoMeta) => void
  setVideoFile: (file: File) => void
  setFitTimeline: (timeline: FitTimeline) => void
  setFitFile: (file: File) => void
  setSync: (sync: Partial<TimelineSync>) => void
  addGauge: (metric: MetricKey) => void
  removeGauge: (id: string) => void
  updateGauge: (id: string, patch: Partial<GaugeConfig>) => void
  applyPreset: (presetId: string) => void
  reset: () => void
}

const initialState: ProjectState = {
  projectId: 'new',
  videoMeta: null,
  videoFile: null,
  fitTimeline: null,
  fitFile: null,
  sync: { fitStartOffset: 0, videoDuration: 0, videoStartOffset: 0 },
  gauges: [],
}

function computeAutoOffset(
  creationTime: number,
  fitStart: number,
  fitEnd: number,
): number | null {
  const offset = creationTime - fitStart
  const fitDuration = fitEnd - fitStart
  return offset >= 0 && offset <= fitDuration ? offset : null
}

let gaugeCounter = 0

function makeGaugeId(): string {
  return `gauge-${++gaugeCounter}-${Date.now().toString(36)}`
}

export const useProjectStore = create<ProjectState & ProjectActions>(
  (set) => ({
    ...initialState,

    setVideoMeta: (meta) =>
      set((s) => {
        const sync = { ...s.sync, videoDuration: meta.duration }
        if (meta.creationTime != null && s.fitTimeline) {
          const auto = computeAutoOffset(meta.creationTime, s.fitTimeline.startTime, s.fitTimeline.endTime)
          if (auto != null) sync.fitStartOffset = auto
        }
        return { videoMeta: meta, sync }
      }),

    setVideoFile: (file) => set({ videoFile: file }),

    setFitTimeline: (timeline) =>
      set((s) => {
        if (s.videoMeta?.creationTime != null) {
          const auto = computeAutoOffset(s.videoMeta.creationTime, timeline.startTime, timeline.endTime)
          if (auto != null) {
            return { fitTimeline: timeline, sync: { ...s.sync, fitStartOffset: auto } }
          }
        }
        return { fitTimeline: timeline }
      }),

    setFitFile: (file) => set({ fitFile: file }),

    setSync: (patch) =>
      set((s) => ({ sync: { ...s.sync, ...patch } })),

    addGauge: (metric) => {
      const cfg = METRIC_CONFIG[metric]
      const existingCount = useProjectStore.getState().gauges.length
      const spacing = DEFAULT_GAUGE_SIZE.height + 0.02
      const newGauge: GaugeConfig = {
        id: makeGaugeId(),
        metric,
        position: { x: 0.06, y: 0.06 + existingCount * spacing },
        size: { ...DEFAULT_GAUGE_SIZE },
        visible: true,
        style: 'arc',
        colorZones: COLOR_ZONES_BY_METRIC[metric],
        dampingFactor: DEFAULT_DAMPING[metric],
        label: cfg.label,
        unit: cfg.unit,
        minValue: cfg.min,
        maxValue: cfg.max,
      }
      set((s) => ({ gauges: [...s.gauges, newGauge] }))
    },

    removeGauge: (id) =>
      set((s) => ({ gauges: s.gauges.filter((g) => g.id !== id) })),

    updateGauge: (id, patch) =>
      set((s) => ({
        gauges: s.gauges.map((g) => {
          if (g.id !== id) return g
          const updated = { ...g, ...patch }
          // Clamp size within bounds
          if (patch.size) {
            updated.size = {
              width: Math.max(
                GAUGE_MIN_SIZE.width,
                Math.min(GAUGE_MAX_SIZE.width, updated.size.width),
              ),
              height: Math.max(
                GAUGE_MIN_SIZE.height,
                Math.min(GAUGE_MAX_SIZE.height, updated.size.height),
              ),
            }
          }
          // Clamp position within 0-1
          if (patch.position) {
            updated.position = {
              x: Math.max(0, Math.min(1, updated.position.x)),
              y: Math.max(0, Math.min(1, updated.position.y)),
            }
          }
          return updated
        }),
      })),

    applyPreset: (presetId) => {
      const preset = PRESETS.find((p) => p.id === presetId)
      if (!preset) {
        console.warn(`[stridash] Preset "${presetId}" not found`)
        return
      }
      const gauges = preset.gauges.map((g) => ({
        ...g,
        id: makeGaugeId(),
      }))
      set({ gauges })
    },

    reset: () => {
      gaugeCounter = 0
      set(initialState)
    },
  }),
)
