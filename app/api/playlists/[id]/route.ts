import { type NextRequest, NextResponse } from "next/server"
import { getPlaylistContent } from "@/lib/db-operations"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const playlistId = Number.parseInt(id, 10)

    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID" }, { status: 400 })
    }

    const playlist = await getPlaylistContent(playlistId)

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("[v0] Get playlist content error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist content" }, { status: 500 })
  }
}
