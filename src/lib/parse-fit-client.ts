import FitParser from 'fit-file-parser'
import type { FitRecord, FitTimeline } from './types'

/**
 * Parse a .fit file client-side and return structured timeline data.
 */
export async function parseFitFileClient(
  file: File,
): Promise<FitTimeline> {
  const arrayBuffer = await file.arrayBuffer()

  const parser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    elapsedRecordField: true,
  })

  const parsed = await new Promise<any>((resolve, reject) => {
    parser.parse(arrayBuffer, (error: any, data: any) => {
      if (error) reject(error)
      else resolve(data)
    })
  })

  const rawRecords = parsed.records ?? []

  const records: FitRecord[] = rawRecords
    .filter((r: any) => r.timestamp != null)
    .map((r: any) => {
      const ts =
        r.timestamp instanceof Date
          ? r.timestamp.getTime() / 1000
          : 0

      // Convert speed from km/h to m/s for internal use
      // fit-file-parser v2 uses enhanced_speed for newer FIT files
      const speedKmh = r.enhanced_speed ?? r.speed
      const speedMs = speedKmh != null ? speedKmh / 3.6 : undefined

      // Garmin cadence is in rpm (half cycles), double for steps per minute
      const cadenceSpm = r.cadence != null ? r.cadence * 2 : undefined

      return {
        timestamp: ts,
        heartRate: r.heart_rate ?? undefined,
        speed: speedMs,
        cadence: cadenceSpm,
        power: r.power ?? undefined,
        altitude: r.enhanced_altitude ?? r.altitude ?? undefined,
        latitude: r.position_lat ?? undefined,
        longitude: r.position_long ?? undefined,
        distance: r.distance ?? undefined,
      } satisfies FitRecord
    })

  if (records.length === 0) {
    throw new Error('No records found in FIT file')
  }

  const startTime = records[0].timestamp
  const endTime = records[records.length - 1].timestamp
  const totalDistance = records[records.length - 1].distance ?? 0

  const avg = (vals: (number | undefined)[]) => {
    const nums = vals.filter((v): v is number => v != null)
    return nums.length > 0
      ? nums.reduce((a, b) => a + b, 0) / nums.length
      : undefined
  }

  return {
    records,
    startTime,
    endTime,
    totalDistance,
    avgHeartRate: avg(records.map((r) => r.heartRate)),
    avgSpeed: avg(records.map((r) => r.speed)),
    avgCadence: avg(records.map((r) => r.cadence)),
    avgPower: avg(records.map((r) => r.power)),
  }
}
