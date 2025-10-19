import { type NextRequest, NextResponse } from "next/server"
import { isDownloaded, getBlobUrl } from "@/lib/db-operations"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if track is downloaded
    const downloaded = await isDownloaded(id)

    if (!downloaded) {
      return NextResponse.json({ error: "Track is downloading, try again shortly" }, { status: 503 })
    }

    // Get blob URL and redirect to it
    const blobUrl = await getBlobUrl(id)

    if (!blobUrl) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 })
    }

    // Proxy the audio stream from Vercel Blob
    const audioResponse = await fetch(blobUrl)

    if (!audioResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: 500 })
    }

    // Forward the audio stream with proper headers
    const headers = new Headers()
    headers.set("Content-Type", audioResponse.headers.get("Content-Type") || "audio/mpeg")
    headers.set("Accept-Ranges", "bytes")

    // Handle range requests for seeking
    const range = request.headers.get("range")
    if (range && audioResponse.headers.get("Content-Length")) {
      const contentLength = Number.parseInt(audioResponse.headers.get("Content-Length") || "0")
      const parts = range.replace(/bytes=/, "").split("-")
      const start = Number.parseInt(parts[0], 10)
      const end = parts[1] ? Number.parseInt(parts[1], 10) : contentLength - 1

      headers.set("Content-Range", `bytes ${start}-${end}/${contentLength}`)
      headers.set("Content-Length", String(end - start + 1))

      return new NextResponse(audioResponse.body, {
        status: 206,
        headers,
      })
    }

    return new NextResponse(audioResponse.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("[v0] Audio stream error:", error)
    return NextResponse.json({ error: "Failed to stream audio" }, { status: 500 })
  }
}
