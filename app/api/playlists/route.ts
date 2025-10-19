import { type NextRequest, NextResponse } from "next/server"
import { getAllPlaylists, createPlaylist, deletePlaylist, editPlaylist } from "@/lib/db-operations"

export async function GET() {
  try {
    const playlists = await getAllPlaylists()
    return NextResponse.json({ playlists })
  } catch (error) {
    console.error("[v0] Get playlists error:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    const playlist = await createPlaylist(name)

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("[v0] Create playlist error:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name } = body

    if (!id || !name) {
      return NextResponse.json({ error: "Playlist ID and name are required" }, { status: 400 })
    }

    const playlist = await editPlaylist(id, name)

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("[v0] Edit playlist error:", error)
    return NextResponse.json({ error: "Failed to edit playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    await deletePlaylist(id)

    return NextResponse.json({ status: "deleted" })
  } catch (error) {
    console.error("[v0] Delete playlist error:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}
