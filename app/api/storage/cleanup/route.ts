import { NextResponse } from "next/server"
import { cleanupOrphanedBlobs } from "@/lib/blob"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    // Get all valid track IDs from database
    const tracks = await sql`SELECT id FROM downloads`
    const validTrackIds = new Set(tracks.map((t) => t.id))

    // Clean up orphaned blobs
    const deletedCount = await cleanupOrphanedBlobs(validTrackIds)

    return NextResponse.json({
      status: "success",
      deletedCount,
      message: `Cleaned up ${deletedCount} orphaned audio files`,
    })
  } catch (error) {
    console.error("[v0] Cleanup error:", error)
    return NextResponse.json({ error: "Failed to cleanup storage" }, { status: 500 })
  }
}
