import { NextResponse } from "next/server"
import { getQueueStatus } from "@/lib/queue"

export async function GET() {
  try {
    const status = await getQueueStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Queue status error:", error)
    return NextResponse.json({ error: "Failed to fetch queue status" }, { status: 500 })
  }
}
