import { useCallback, useRef, useState } from 'react'
import { useProjectStore } from '~/stores/project-store'
import { Button } from '~/components/ui/button'

type ExportState =
  | { status: 'idle' }
  | { status: 'exporting' }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string }

export function ExportPanel() {
  const videoMeta = useProjectStore((s) => s.videoMeta)
  const videoFile = useProjectStore((s) => s.videoFile)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)
  const sync = useProjectStore((s) => s.sync)
  const gauges = useProjectStore((s) => s.gauges)

  const [state, setState] = useState<ExportState>({ status: 'idle' })
  const blobUrlRef = useRef<string | null>(null)

  const canExport =
    videoMeta != null &&
    videoFile != null &&
    fitTimeline != null &&
    gauges.length > 0

  const handleExport = useCallback(async () => {
    if (!videoMeta || !videoFile || !fitTimeline) return

    // Revoke previous blob URL if any
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    setState({ status: 'exporting' })

    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('fitTimeline', JSON.stringify(fitTimeline))
      formData.append('sync', JSON.stringify(sync))
      formData.append('gauges', JSON.stringify(gauges))
      formData.append('videoMeta', JSON.stringify({
        width: videoMeta.width,
        height: videoMeta.height,
        fps: videoMeta.fps,
      }))

      const res = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText)
        throw new Error(`Export failed: ${text}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setState({ status: 'done', url })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed'
      setState({ status: 'error', message: msg })
    }
  }, [videoMeta, videoFile, fitTimeline, sync, gauges])

  const handleDownload = useCallback(() => {
    if (state.status !== 'done') return
    const a = document.createElement('a')
    a.href = state.url
    a.download = `stridash-${Date.now()}.mp4`
    a.click()
  }, [state])

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4">
      <h3 className="text-sm font-semibold text-foreground/80">Export</h3>

      <Button
        onClick={handleExport}
        disabled={!canExport || state.status === 'exporting'}
      >
        {state.status === 'exporting'
          ? 'Exporting...'
          : state.status === 'error'
            ? 'Retry Export'
            : 'Export MP4'}
      </Button>

      {state.status === 'exporting' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Rendering gauges & compositing video...</span>
        </div>
      )}

      {state.status === 'done' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-secondary">Export complete</p>
          <Button variant="secondary" onClick={handleDownload}>
            Download MP4
          </Button>
        </div>
      )}

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
