import { type NextRequest, NextResponse } from "next/server"
import { uploadAudio } from "@/lib/blob"
import { logTrack, logDownload } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const trackId = formData.get("trackId") as string
    const title = formData.get("title") as string
    const artist = formData.get("artist") as string | null
    const duration = formData.get("duration") as string | null

    if (!file || !trackId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Vercel Blob
    const { url, size } = await uploadAudio(trackId, buffer, file.type)

    // Log track metadata
    await logTrack({
      id: trackId,
      title,
      artist: artist || undefined,
      duration: duration ? Number.parseInt(duration, 10) : undefined,
    })

    // Log download with blob URL
    const track = await logDownload(trackId, url, size)

    return NextResponse.json({
      status: "success",
      track,
      blobUrl: url,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 })
  }
}

// Increase max file size for audio uploads (100MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
}
