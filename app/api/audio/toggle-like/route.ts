import { type NextRequest, NextResponse } from "next/server"
import { toggleLike } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const isLiked = await toggleLike(id)

    return NextResponse.json({ status: "toggled", liked: isLiked })
  } catch (error) {
    console.error("[v0] Toggle like error:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
