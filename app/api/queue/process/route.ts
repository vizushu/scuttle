import { type NextRequest, NextResponse } from "next/server"
import { updateTrackPlaylists } from "@/lib/db-operations"
import type { DownloadJob } from "@/lib/queue"

// This endpoint is called by Vercel Queues to process jobs
export async function POST(request: NextRequest) {
  try {
    const job: DownloadJob = await request.json()

    console.log(`[v0] Processing download job:`, job.id || job.query)

    // In a real implementation, this would:
    // 1. Use yt-dlp or similar to download the audio
    // 2. Extract metadata
    // 3. Upload to Vercel Blob
    // 4. Update database

    // For now, we'll create a placeholder implementation
    // that expects the audio buffer to be provided externally

    // Simulate download process
    const trackId = job.id || generateTrackId(job.query || "")
    const metadata = job.metadata || {
      title: job.query || "Unknown Title",
      artist: "Unknown Artist",
    }

    // NOTE: In production, you would integrate with yt-dlp here
    // For now, this is a placeholder that would need external worker
    console.log(`[v0] Would download: ${trackId} - ${metadata.title}`)

    // Update playlists if specified
    if (job.updates && Object.keys(job.updates).length > 0) {
      const playlistUpdates = Object.entries(job.updates).map(([id, checked]) => ({
        id: Number.parseInt(id, 10),
        checked: checked as boolean,
      }))

      await updateTrackPlaylists(trackId, playlistUpdates)
    }

    return NextResponse.json({
      status: "processed",
      trackId,
    })
  } catch (error) {
    console.error("[v0] Process job error:", error)
    return NextResponse.json({ error: "Failed to process job" }, { status: 500 })
  }
}

function generateTrackId(query: string): string {
  return `track_${Date.now()}_${query.slice(0, 20).replace(/[^a-z0-9]/gi, "_")}`
}

// Configure for longer timeout (Vercel Pro: 60s, Hobby: 10s)
export const maxDuration = 60
