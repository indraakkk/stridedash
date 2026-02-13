import { Composition } from 'remotion'
import { RunOverlay } from './RunOverlay'
import type { GaugeConfig, TimelineSync } from '~/lib/types'

// Default props for Remotion Studio preview
const defaultProps = {
  fitTimeline: null as null,
  sync: {
    fitStartOffset: 0,
    videoDuration: 60,
    videoStartOffset: 0,
  } satisfies TimelineSync,
  gauges: [] as GaugeConfig[],
  videoSrc: null as string | null,
}

export function RemotionRoot() {
  return (
    <Composition
      id="RunOverlay"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={RunOverlay as any}
      durationInFrames={30 * 60}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  )
}
