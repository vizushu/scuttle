"use client"

import { create } from "zustand"

interface Track {
  id: string
  title: string
  artist: string | null
  duration: number | null
}

interface AudioPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  queue: Track[]
  queueIndex: number

  setCurrentTrack: (track: Track) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  next: () => void
  previous: () => void
  setQueue: (tracks: Track[]) => void
  addToQueue: (track: Track) => void
  clearQueue: () => void
}

export const useAudioPlayer = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: -1,

  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume) => set({ volume }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  next: () => {
    const { queue, queueIndex } = get()
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1
      set({
        currentTrack: queue[nextIndex],
        queueIndex: nextIndex,
        isPlaying: true,
      })
    }
  },

  previous: () => {
    const { queue, queueIndex } = get()
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1
      set({
        currentTrack: queue[prevIndex],
        queueIndex: prevIndex,
        isPlaying: true,
      })
    }
  },

  setQueue: (tracks) => set({ queue: tracks, queueIndex: 0 }),

  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

  clearQueue: () => set({ queue: [], queueIndex: -1 }),
}))
