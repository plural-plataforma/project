import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TourStore {
  hasSeenTour: boolean
  setHasSeenTour: (value: boolean) => void
}

export const useTourStore = create<TourStore>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      setHasSeenTour: (value) => set({ hasSeenTour: value }),
    }),
    { name: 'plural-tour' }
  )
)
