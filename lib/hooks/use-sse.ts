"use client"

import { useEffect, useState } from "react"
import { mutate } from "swr"

interface SSEEvent {
  type: string
  data?: unknown
}

export function useSSE(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log("[v0] SSE connected")
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("[v0] SSE event:", data)
        setLastEvent(data)

        // Trigger SWR revalidation on events
        if (data.type !== "connected") {
          mutate(() => true)
        }
      } catch (error) {
        console.error("[v0] Failed to parse SSE event:", error)
      }
    }

    eventSource.onerror = () => {
      console.error("[v0] SSE connection error")
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [url])

  return { isConnected, lastEvent }
}
