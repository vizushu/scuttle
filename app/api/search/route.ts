import { type NextRequest, NextResponse } from "next/server"
import { searchTracks } from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    const tracks = await searchTracks(query)

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
