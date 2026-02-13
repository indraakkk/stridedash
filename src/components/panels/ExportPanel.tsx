import { useCallback, useState } from 'react'
import { useProjectStore } from '~/stores/project-store'
import { renderOverlayToBlob, type RenderProgress } from '~/lib/render-overlay'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Separator } from '~/components/ui/separator'

type ExportState =
  | { status: 'idle' }
  | { status: 'rendering'; progress: RenderProgress }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string }

export function ExportPanel() {
  const videoMeta = useProjectStore((s) => s.videoMeta)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)
  const sync = useProjectStore((s) => s.sync)
  const gauges = useProjectStore((s) => s.gauges)

  const [state, setState] = useState<ExportState>({ status: 'idle' })

  const canExport = videoMeta != null && fitTimeline != null && gauges.length > 0

  const handleExport = useCallback(async () => {
    if (!videoMeta || !fitTimeline) return

    setState({ status: 'rendering', progress: { currentFrame: 0, totalFrames: 1, phase: 'rendering' } })

    try {
      const blob = await renderOverlayToBlob(
        fitTimeline,
        sync,
        gauges,
        videoMeta.width,
        videoMeta.height,
        videoMeta.fps,
        videoMeta.duration,
        (progress) => {
          setState({ status: 'rendering', progress })
        },
        videoMeta.filePath,
      )

      const url = URL.createObjectURL(blob)
      setState({ status: 'done', url })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed'
      setState({ status: 'error', message: msg })
    }
  }, [videoMeta, fitTimeline, sync, gauges])

  const handleDownload = useCallback(() => {
    if (state.status !== 'done') return
    const a = document.createElement('a')
    a.href = state.url
    a.download = `stridash-${Date.now()}.webm`
    a.click()
  }, [state])

  const progressPercent = state.status === 'rendering'
    ? (state.progress.currentFrame / state.progress.totalFrames) * 100
    : 0

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4">
      <h3 className="text-sm font-semibold text-foreground/80">
        Export
      </h3>

      {/* Export button */}
      <Button
        onClick={handleExport}
        disabled={!canExport || state.status === 'rendering'}
      >
        {state.status === 'rendering' ? 'Rendering...' : 'Export Video'}
      </Button>

      {/* Progress */}
      {state.status === 'rendering' && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{state.progress.phase}</span>
            <span>
              {state.progress.currentFrame}/{state.progress.totalFrames}
            </span>
          </div>
          <Progress value={progressPercent} />
          <p className="mt-1 text-xs text-muted-foreground">
            Keep this tab active during export
          </p>
        </div>
      )}

      {/* Download */}
      {state.status === 'done' && (
        <Button
          variant="secondary"
          onClick={handleDownload}
        >
          Download Video
        </Button>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      {!canExport && (
        <p className="text-xs text-muted-foreground">
          Upload video + .fit file and add gauges to export
        </p>
      )}
    </div>
  )
}
