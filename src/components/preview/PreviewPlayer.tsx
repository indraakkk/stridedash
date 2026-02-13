import { Player, type PlayerRef } from '@remotion/player'
import { useCallback, useEffect, useRef } from 'react'
import { RunOverlay } from '~/remotion/RunOverlay'
import { useProjectStore } from '~/stores/project-store'
import { usePlaybackStore } from '~/stores/playback-store'

interface PreviewPlayerProps {
  width: number
  height: number
}

export function PreviewPlayer({ width, height }: PreviewPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)
  const fitTimeline = useProjectStore((s) => s.fitTimeline)
  const sync = useProjectStore((s) => s.sync)
  const gauges = useProjectStore((s) => s.gauges)
  const videoMeta = useProjectStore((s) => s.videoMeta)
  const setFrame = usePlaybackStore((s) => s.setFrame)
  const setIsPlaying = usePlaybackStore((s) => s.setIsPlaying)

  const fps = videoMeta?.fps ?? 30
  const durationSeconds = videoMeta?.duration ?? 60
  const durationInFrames = Math.max(1, Math.round(durationSeconds * fps))

  const handleFrameUpdate = useCallback(
    (e: { detail: { frame: number } }) => {
      setFrame(e.detail.frame)
    },
    [setFrame],
  )

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    player.addEventListener('frameupdate', handleFrameUpdate as any)
    player.addEventListener('play', () => setIsPlaying(true))
    player.addEventListener('pause', () => setIsPlaying(false))

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate as any)
      player.removeEventListener('play', () => setIsPlaying(true))
      player.removeEventListener('pause', () => setIsPlaying(false))
    }
  }, [handleFrameUpdate, setIsPlaying])

  const inputProps = {
    fitTimeline,
    sync,
    gauges,
    videoSrc: videoMeta?.filePath ?? null,
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="overflow-hidden rounded-lg bg-black"
        style={{ width, height }}
      >
        <Player
          ref={playerRef}
          component={RunOverlay}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={fps}
          style={{
            width,
            height,
          }}
          controls
          loop
        />
      </div>
      <FrameCounter />
    </div>
  )
}

function FrameCounter() {
  const frame = usePlaybackStore((s) => s.frame)
  const fps = usePlaybackStore((s) => s.fps)
  const time = frame / fps

  const mins = Math.floor(time / 60)
  const secs = Math.floor(time % 60)
  const ms = Math.floor((time % 1) * 100)

  return (
    <p className="font-mono text-xs text-muted-foreground">
      {mins}:{secs.toString().padStart(2, '0')}.{ms.toString().padStart(2, '0')}{' '}
      · frame {frame}
    </p>
  )
}
