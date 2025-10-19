"use client"

import { useEffect } from "react"
import { mutate } from "swr"

export function useRealtimeUpdates() {
  useEffect(() => {
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      // Revalidate all SWR caches
      mutate(() => true)
    }, 5000)

    return () => clearInterval(interval)
  }, [])
}
