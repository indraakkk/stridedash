import { create } from 'zustand'
import type { SnapGuide } from '~/lib/types'

interface UiState {
  selectedGaugeId: string | null
  showSafeZone: boolean
  isDragging: boolean
  isResizing: boolean
  activeSnapGuides: SnapGuide[]
}

interface UiActions {
  selectGauge: (id: string | null) => void
  toggleSafeZone: () => void
  setDragging: (dragging: boolean) => void
  setResizing: (resizing: boolean) => void
  setActiveSnapGuides: (guides: SnapGuide[]) => void
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  selectedGaugeId: null,
  showSafeZone: true,
  isDragging: false,
  isResizing: false,
  activeSnapGuides: [],

  selectGauge: (id) => set({ selectedGaugeId: id }),
  toggleSafeZone: () => set((s) => ({ showSafeZone: !s.showSafeZone })),
  setDragging: (isDragging) => set({ isDragging }),
  setResizing: (isResizing) => set({ isResizing }),
  setActiveSnapGuides: (activeSnapGuides) => set({ activeSnapGuides }),
}))
