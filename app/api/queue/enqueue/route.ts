import { type NextRequest, NextResponse } from "next/server"
import { enqueueDownload } from "@/lib/queue"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const downloadId = await enqueueDownload(url, title)

    return NextResponse.json({
      status: "enqueued",
      downloadId,
      message: "Download queued successfully. The worker will process it shortly.",
    })
  } catch (error) {
    console.error("[v0] Enqueue error:", error)
    return NextResponse.json({ error: "Failed to enqueue download" }, { status: 500 })
  }
}
