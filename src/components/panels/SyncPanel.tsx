import { useCallback, useRef, useState } from 'react'
import { useProjectStore } from '~/stores/project-store'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'

/**
 * Format epoch (seconds) to "HH:MM:SS" in local time.
 * Uses browser's local timezone — the FIT file stores UTC epochs,
 * so displayed times reflect the device's current timezone setting.
 */
function epochToTimeOfDay(epoch: number): string {
  const d = new Date(epoch * 1000)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

/** Format duration in seconds to human-readable "Xh Ym Zs" */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/**
 * Parse "HH:MM:SS" or "HH:MM" to offset from fitStartEpoch in seconds.
 * Handles cross-midnight activities by picking whichever candidate
 * (same-day or next-day) falls within the FIT time range.
 */
function timeOfDayToOffset(
  timeStr: string,
  fitStartEpoch: number,
  fitEndEpoch: number,
): number | null {
  const parts = timeStr.split(':').map(Number)
  if (parts.length < 2 || parts.length > 3) return null
  if (parts.some(isNaN)) return null
  const [h, m, s = 0] = parts
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null

  const fitStartDate = new Date(fitStartEpoch * 1000)
  const fitDuration = fitEndEpoch - fitStartEpoch

  // Build same-day candidate
  const sameDay = new Date(fitStartDate)
  sameDay.setHours(h, m, s, 0)
  const sameDayEpoch = sameDay.getTime() / 1000

  // Build next-day candidate
  const nextDay = new Date(sameDay)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDayEpoch = nextDay.getTime() / 1000

  // Pick whichever candidate falls within [fitStart, fitEnd]
  for (const candidateEpoch of [sameDayEpoch, nextDayEpoch]) {
    const offset = candidateEpoch - fitStartEpoch
    if (offset >= 0 && offset <= fitDuration) {
      return offset
    }
  }

  return null
}

export function SyncPanel() {
  const sync = useProjectStore((s) => s.sync)
  const setSync = useProjectStore((s) => s.setSync)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)

  const fitStart = fitTimeline?.startTime ?? 0
  const fitEnd = fitTimeline?.endTime ?? 0

  // Focus-aware input: only track local editing value while focused
  const [editingValue, setEditingValue] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Derive display from store when not editing
  const displayTime = epochToTimeOfDay(fitStart + sync.fitStartOffset)
  const inputValue = editingValue ?? displayTime

  const handleFocus = useCallback(() => {
    setEditingValue(epochToTimeOfDay(fitStart + useProjectStore.getState().sync.fitStartOffset))
  }, [fitStart])

  const handleBlur = useCallback(() => {
    setEditingValue(null)
  }, [])

  const handleTimeChange = useCallback(
    (value: string) => {
      setEditingValue(value)
      const offset = timeOfDayToOffset(value, fitStart, fitEnd)
      if (offset !== null) {
        setSync({ fitStartOffset: offset })
      }
    },
    [setSync, fitStart, fitEnd],
  )

  const handleNudge = useCallback(
    (delta: number) => {
      // Read fresh from store to avoid stale closure on rapid clicks
      const current = useProjectStore.getState().sync.fitStartOffset
      const fitDuration = fitEnd - fitStart
      const newOffset = Math.max(0, Math.min(fitDuration, current + delta))
      setSync({ fitStartOffset: newOffset })
    },
    [setSync, fitStart, fitEnd],
  )

  if (!fitTimeline) return null

  const fitDuration = fitEnd - fitStart

  return (
    <div className="flex flex-col gap-3 p-4">
      <Separator className="mb-1" />
      <h3 className="text-sm font-semibold text-foreground/80">
        Sync Alignment
      </h3>

      {/* FIT activity time range */}
      <div className="text-xs text-muted-foreground">
        Activity: {epochToTimeOfDay(fitStart)} → {epochToTimeOfDay(fitEnd)} (
        {formatDuration(fitDuration)})
      </div>

      {/* Video starts at FIT time picker */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">
          Video starts at:
        </label>
        <Input
          ref={inputRef}
          type="text"
          placeholder="HH:MM:SS"
          value={inputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="h-7 w-24 text-xs font-mono"
        />
      </div>

      {/* Quick nudge buttons */}
      <div className="flex gap-1">
        {[-5, -1, -0.1, 0.1, 1, 5].map((delta) => (
          <Button
            key={delta}
            variant="outline"
            size="sm"
            onClick={() => handleNudge(delta)}
            className="h-7 px-2 text-xs"
          >
            {delta > 0 ? '+' : ''}
            {delta}s
          </Button>
        ))}
      </div>

      {/* Secondary info */}
      <div className="text-xs text-muted-foreground">
        <p>
          Offset: {sync.fitStartOffset >= 0 ? '+' : ''}
          {sync.fitStartOffset.toFixed(1)}s
        </p>
        <p>Video duration: {sync.videoDuration.toFixed(1)}s</p>
      </div>
    </div>
  )
}
