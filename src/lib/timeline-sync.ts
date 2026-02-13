import type { FitRecord, FitTimeline, TimelineSync } from './types'

export class TimelineSyncEngine {
  private records: FitRecord[]
  private startTime: number
  private endTime: number

  constructor(
    private timeline: FitTimeline,
    private sync: TimelineSync,
  ) {
    this.records = timeline.records
    this.startTime = timeline.startTime
    this.endTime = timeline.endTime
  }

  /** Get interpolated FIT data at a given video frame */
  getDataAtFrame(frame: number, fps: number): FitRecord | null {
    const videoTime = frame / fps // seconds into video
    const fitTime = this.startTime + this.sync.fitStartOffset + videoTime

    // Out of FIT data bounds
    if (fitTime < this.startTime || fitTime > this.endTime) {
      return null
    }

    // Binary search for the two surrounding records
    const { before, after } = this.findSurroundingRecords(fitTime)
    if (!before) return null
    if (!after) return before

    // Linear interpolation factor
    const span = after.timestamp - before.timestamp
    if (span <= 0) return before
    const t = (fitTime - before.timestamp) / span

    return this.interpolate(before, after, t)
  }

  private findSurroundingRecords(targetTime: number): {
    before: FitRecord | null
    after: FitRecord | null
  } {
    const records = this.records
    if (records.length === 0) return { before: null, after: null }

    // Binary search
    let lo = 0
    let hi = records.length - 1

    if (targetTime <= records[lo].timestamp) {
      return { before: records[lo], after: records[lo + 1] ?? null }
    }
    if (targetTime >= records[hi].timestamp) {
      return { before: records[hi], after: null }
    }

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (records[mid].timestamp <= targetTime) {
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    // hi is the last record with timestamp <= targetTime
    return {
      before: records[hi],
      after: records[hi + 1] ?? null,
    }
  }

  private interpolate(a: FitRecord, b: FitRecord, t: number): FitRecord {
    const lerp = (
      v1: number | undefined,
      v2: number | undefined,
    ): number | undefined => {
      if (v1 == null && v2 == null) return undefined
      if (v1 == null) return v2
      if (v2 == null) return v1
      return v1 + (v2 - v1) * t
    }

    return {
      timestamp: a.timestamp + (b.timestamp - a.timestamp) * t,
      heartRate: lerp(a.heartRate, b.heartRate),
      speed: lerp(a.speed, b.speed),
      cadence: lerp(a.cadence, b.cadence),
      power: lerp(a.power, b.power),
      altitude: lerp(a.altitude, b.altitude),
      latitude: lerp(a.latitude, b.latitude),
      longitude: lerp(a.longitude, b.longitude),
      distance: lerp(a.distance, b.distance),
    }
  }
}
