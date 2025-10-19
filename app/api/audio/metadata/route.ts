import { type NextRequest, NextResponse } from "next/server"
import { setCustomMetadata } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, customTitle, customArtist } = body

    if (!id) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const updated = await setCustomMetadata(id, customTitle, customArtist)

    return NextResponse.json({ track: updated })
  } catch (error) {
    console.error("[v0] Update metadata error:", error)
    return NextResponse.json({ error: "Failed to update metadata" }, { status: 500 })
  }
}
