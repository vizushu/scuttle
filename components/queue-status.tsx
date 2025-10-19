"use client"

import useSWR from "swr"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function QueueStatus() {
  const { data } = useSWR<{ pending: number; processing: number }>("/api/queue/status", fetcher, {
    refreshInterval: 2000,
  })

  if (!data || (data.pending === 0 && data.processing === 0)) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 bg-card border rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Download Queue</span>
      </div>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <div>Processing: {data.processing}</div>
        <div>Pending: {data.pending}</div>
      </div>
    </div>
  )
}
