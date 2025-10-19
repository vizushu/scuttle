import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting database migration...")

    // Create tracks table
    await sql`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        duration INTEGER,
        custom_title TEXT,
        custom_artist TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create downloads table
    await sql`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blob_url TEXT NOT NULL,
        file_size BIGINT,
        FOREIGN KEY (id) REFERENCES tracks(id) ON DELETE CASCADE
      )
    `

    // Create likes table
    await sql`
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES downloads(id) ON DELETE CASCADE
      )
    `

    // Create playlists table
    await sql`
      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create playlist_tracks table
    await sql`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INTEGER NOT NULL,
        track_id TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        position INTEGER DEFAULT 0,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES downloads(id) ON DELETE CASCADE,
        PRIMARY KEY (playlist_id, track_id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist)`
    await sql`CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_likes_liked_at ON likes(liked_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id)`

    // Create full-text search index
    await sql`CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING gin(to_tsvector('english', title || ' ' || COALESCE(artist, '')))`

    console.log("[v0] Migration completed successfully")

    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      tables: tables.map((t) => t.table_name),
    })
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
