import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    // This will be enhanced when we integrate actual yt-dlp search
    // For now, we'll create realistic mock data that shows proper formatting
    const results = [
      {
        id: `yt-${Date.now()}-1`,
        title: query,
        artist: "Official Audio",
        url: `ytsearch:${query}`,
        thumbnail: `https://img.youtube.com/vi/placeholder/default.jpg`,
        duration: "3:45",
        source: "youtube",
      },
      {
        id: `yt-${Date.now()}-2`,
        title: `${query} (Lyrics)`,
        artist: "Music Channel",
        url: `ytsearch:${query} lyrics`,
        thumbnail: `https://img.youtube.com/vi/placeholder/default.jpg`,
        duration: "3:52",
        source: "youtube",
      },
      {
        id: `yt-${Date.now()}-3`,
        title: `${query} (Official Music Video)`,
        artist: "VEVO",
        url: `ytsearch:${query} official`,
        thumbnail: `https://img.youtube.com/vi/placeholder/default.jpg`,
        duration: "4:12",
        source: "youtube",
      },
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[v0] YouTube search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
