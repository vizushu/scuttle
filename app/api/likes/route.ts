import { NextResponse } from "next/server"
import { fetchLikedTracks } from "@/lib/db-operations"

export async function GET() {
  try {
    const likedTrackIds = await fetchLikedTracks()
    return NextResponse.json({ likes: likedTrackIds })
  } catch (error) {
    console.error("[v0] Fetch likes error:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  }
}
