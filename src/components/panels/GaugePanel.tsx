import { useProjectStore } from '~/stores/project-store'
import { useUiStore } from '~/stores/ui-store'
import { PRESETS } from '~/lib/constants'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Heart, Timer, Footprints, Zap, Eye, EyeOff, X } from 'lucide-react'
import type { MetricKey } from '~/lib/types'
import type { LucideIcon } from 'lucide-react'

const METRICS: { key: MetricKey; label: string; icon: LucideIcon }[] = [
  { key: 'heartRate', label: 'Heart Rate', icon: Heart },
  { key: 'pace', label: 'Pace', icon: Timer },
  { key: 'cadence', label: 'Cadence', icon: Footprints },
  { key: 'power', label: 'Power', icon: Zap },
]

export function GaugePanel() {
  const addGauge = useProjectStore((s) => s.addGauge)
  const removeGauge = useProjectStore((s) => s.removeGauge)
  const updateGauge = useProjectStore((s) => s.updateGauge)
  const applyPreset = useProjectStore((s) => s.applyPreset)
  const gauges = useProjectStore((s) => s.gauges)
  const toggleSafeZone = useUiStore((s) => s.toggleSafeZone)
  const showSafeZone = useUiStore((s) => s.showSafeZone)
  const selectGauge = useUiStore((s) => s.selectGauge)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Add gauge buttons */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground/80">
          Add Gauge
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => addGauge(key)}
              className="justify-start gap-1.5 bg-muted/60 hover:bg-muted"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Presets */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground/80">
          Presets
        </h3>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.id)}
              className="justify-start"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Safe zone toggle */}
      <section>
        <Button
          variant={showSafeZone ? 'default' : 'outline'}
          size="sm"
          onClick={toggleSafeZone}
          className="w-full justify-start gap-2"
        >
          {showSafeZone ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          Safe Zone {showSafeZone ? 'On' : 'Off'}
        </Button>
      </section>

      {/* Active gauges */}
      {gauges.length > 0 && (
        <section>
          <Separator className="mb-4" />
          <h3 className="mb-2 text-sm font-semibold text-foreground/80">
            Active Gauges
          </h3>
          <div className="flex flex-col gap-1.5">
            {gauges.map((gauge) => (
              <div
                key={gauge.id}
                className="flex items-center justify-between rounded-md bg-muted px-3 py-2 cursor-pointer hover:bg-muted/80 animate-in fade-in slide-in-from-top-1 duration-200"
                onClick={() => selectGauge(gauge.id)}
              >
                <span className="text-sm text-foreground">{gauge.label}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateGauge(gauge.id, { visible: !gauge.visible })
                    }}
                    className="h-6 w-6 p-0"
                    title={gauge.visible ? 'Hide' : 'Show'}
                  >
                    {gauge.visible ? (
                      <Eye className="h-3.5 w-3.5 text-foreground" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeGauge(gauge.id)
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
