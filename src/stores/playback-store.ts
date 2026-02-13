import { create } from 'zustand'

interface PlaybackState {
  frame: number
  isPlaying: boolean
  fps: number
}

interface PlaybackActions {
  setFrame: (frame: number) => void
  setIsPlaying: (playing: boolean) => void
  setFps: (fps: number) => void
  togglePlay: () => void
  getCurrentTime: () => number
}

export const usePlaybackStore = create<PlaybackState & PlaybackActions>(
  (set, get) => ({
    frame: 0,
    isPlaying: false,
    fps: 30,

    setFrame: (frame) => set({ frame }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setFps: (fps) => set({ fps }),
    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
    getCurrentTime: () => {
      const { frame, fps } = get()
      return frame / fps
    },
  }),
)
