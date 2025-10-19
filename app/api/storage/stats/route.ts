import { NextResponse } from "next/server"
import { listAllAudio } from "@/lib/blob"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get blob storage stats
    const allBlobs = await listAllAudio()
    const totalSize = allBlobs.reduce((sum, blob) => sum + blob.size, 0)

    // Get database stats
    const trackCount = await sql`SELECT COUNT(*) as count FROM tracks`
    const downloadCount = await sql`SELECT COUNT(*) as count FROM downloads`
    const playlistCount = await sql`SELECT COUNT(*) as count FROM playlists`

    return NextResponse.json({
      storage: {
        totalFiles: allBlobs.length,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
      database: {
        tracks: trackCount[0].count,
        downloads: downloadCount[0].count,
        playlists: playlistCount[0].count,
      },
    })
  } catch (error) {
    console.error("[v0] Storage stats error:", error)
    return NextResponse.json({ error: "Failed to fetch storage stats" }, { status: 500 })
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
