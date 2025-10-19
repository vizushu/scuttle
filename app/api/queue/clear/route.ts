import { NextResponse } from "next/server"
import { clearQueue } from "@/lib/queue"

export async function POST() {
  try {
    await clearQueue()

    return NextResponse.json({
      status: "cleared",
      message: "Download queue has been cleared",
    })
  } catch (error) {
    console.error("[v0] Clear queue error:", error)
    return NextResponse.json({ error: "Failed to clear queue" }, { status: 500 })
  }
}
