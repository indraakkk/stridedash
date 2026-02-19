// --- FIT Data ---

export interface FitRecord {
  timestamp: number // Unix epoch seconds
  heartRate?: number // bpm
  speed?: number // m/s
  cadence?: number // spm (steps per minute, doubled from Garmin's rpm)
  power?: number // watts
  altitude?: number // meters
  latitude?: number // degrees
  longitude?: number // degrees
  distance?: number // meters cumulative
}

export interface FitTimeline {
  records: FitRecord[]
  startTime: number // Unix epoch seconds
  endTime: number // Unix epoch seconds
  totalDistance: number // meters
  avgHeartRate?: number
  avgSpeed?: number
  avgCadence?: number
  avgPower?: number
}

// --- Video ---

export interface VideoMeta {
  duration: number // seconds
  fps: number
  width: number
  height: number
  codec: string
  fileSize: number // bytes
  filePath: string
  creationTime?: number // Unix epoch seconds
}

// --- Timeline Sync ---

export interface TimelineSync {
  fitStartOffset: number // seconds offset: positive = FIT starts after video
  videoDuration: number // seconds
  videoStartOffset: number // seconds offset for video track position
}

// --- Gauge System ---

export type MetricKey = 'heartRate' | 'pace' | 'cadence' | 'power'

export interface GaugePosition {
  x: number // 0-1 normalized
  y: number // 0-1 normalized
}

export interface GaugeSize {
  width: number // 0-1 normalized
  height: number // 0-1 normalized
}

export interface ColorZone {
  min: number
  max: number
  color: string
}

export interface GaugeConfig {
  id: string
  metric: MetricKey
  position: GaugePosition
  size: GaugeSize
  visible: boolean
  style: GaugeStyle
  colorZones: ColorZone[]
  dampingFactor: number
  label: string
  unit: string
  minValue: number
  maxValue: number
}

export type GaugeStyle = 'arc' | 'radial' | 'bar' | 'minimal'

export interface SafeZone {
  top: number // fraction from top
  bottom: number // fraction from bottom
  left: number // fraction from left
  right: number // fraction from right
}

export interface GaugePreset {
  id: string
  name: string
  gauges: Omit<GaugeConfig, 'id'>[]
}

// --- Snap Guides ---

export interface SnapGuide {
  axis: 'x' | 'y'
  position: number // 0-1 normalized
}

// --- Project State ---

export interface ProjectState {
  projectId: string
  videoMeta: VideoMeta | null
  videoFile: File | null
  fitTimeline: FitTimeline | null
  fitFile: File | null
  sync: TimelineSync
  gauges: GaugeConfig[]
}
