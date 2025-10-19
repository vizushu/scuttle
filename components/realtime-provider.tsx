"use client"

import type React from "react"

import { useRealtimeUpdates } from "@/lib/hooks/use-realtime-updates"

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeUpdates()
  return <>{children}</>
}
