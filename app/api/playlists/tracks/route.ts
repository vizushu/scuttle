import { type NextRequest, NextResponse } from "next/server"
import { updateTrackPlaylists } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackId, updates } = body

    if (!trackId || !updates) {
      return NextResponse.json({ error: "Track ID and playlist updates are required" }, { status: 400 })
    }

    await updateTrackPlaylists(trackId, updates)

    return NextResponse.json({ status: "updated" })
  } catch (error) {
    console.error("[v0] Update track playlists error:", error)
    return NextResponse.json({ error: "Failed to update track playlists" }, { status: 500 })
  }
}
