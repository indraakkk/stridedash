import { useProjectStore } from '~/stores/project-store'
import { useUiStore } from '~/stores/ui-store'
import { COLOR_ZONES_BY_METRIC, DEFAULT_DAMPING } from '~/lib/constants'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import type { GaugeStyle, MetricKey } from '~/lib/types'

const GAUGE_STYLES: { value: GaugeStyle; label: string }[] = [
  { value: 'arc', label: 'Arc' },
  { value: 'radial', label: 'Radial' },
  { value: 'bar', label: 'Bar' },
  { value: 'minimal', label: 'Minimal' },
]

export function GaugeConfigPanel() {
  const selectedGaugeId = useUiStore((s) => s.selectedGaugeId)
  const gauges = useProjectStore((s) => s.gauges)
  const updateGauge = useProjectStore((s) => s.updateGauge)

  const gauge = gauges.find((g) => g.id === selectedGaugeId)
  if (!gauge) return null

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4">
      <h3 className="text-sm font-semibold text-foreground/80">
        Gauge Config — {gauge.label}
      </h3>

      {/* Style selector */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Style</label>
        <ToggleGroup
          type="single"
          value={gauge.style}
          onValueChange={(value) => {
            if (value) updateGauge(gauge.id, { style: value as GaugeStyle })
          }}
          className="grid grid-cols-4 gap-1"
        >
          {GAUGE_STYLES.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              size="sm"
              className="text-xs"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Damping slider */}
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">
          Damping: {gauge.dampingFactor.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={gauge.dampingFactor}
          onChange={(e) =>
            updateGauge(gauge.id, {
              dampingFactor: parseFloat(e.target.value),
            })
          }
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Smooth</span>
          <span>Responsive</span>
        </div>
      </div>

      {/* Color zones reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          updateGauge(gauge.id, {
            colorZones: COLOR_ZONES_BY_METRIC[gauge.metric],
            dampingFactor: DEFAULT_DAMPING[gauge.metric],
          })
        }
      >
        Reset to Defaults
      </Button>

      <Separator />

      {/* Min/Max value */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Min</label>
          <Input
            type="number"
            value={gauge.minValue}
            onChange={(e) =>
              updateGauge(gauge.id, { minValue: Number(e.target.value) })
            }
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Max</label>
          <Input
            type="number"
            value={gauge.maxValue}
            onChange={(e) =>
              updateGauge(gauge.id, { maxValue: Number(e.target.value) })
            }
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  )
}
