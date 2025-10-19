import { sql } from "./db"
import type { Track, Playlist } from "./db"

// Track Operations
export async function logTrack(track: {
  id: string
  title: string
  artist?: string
  duration?: number
}): Promise<void> {
  await sql`
    INSERT INTO tracks (id, title, artist, duration, custom_title, custom_artist)
    VALUES (${track.id}, ${track.title}, ${track.artist || null}, ${track.duration || null}, NULL, NULL)
    ON CONFLICT (id) 
    DO UPDATE SET 
      title = EXCLUDED.title,
      artist = EXCLUDED.artist,
      duration = EXCLUDED.duration
  `
}

export async function unlogTrack(id: string): Promise<void> {
  await sql`DELETE FROM tracks WHERE id = ${id}`
}

export async function isLogged(trackId: string): Promise<boolean> {
  const result = await sql`SELECT 1 FROM tracks WHERE id = ${trackId} LIMIT 1`
  return result.length > 0
}

// Download Operations
export async function logDownload(id: string, blobUrl: string, fileSize?: number): Promise<Track> {
  await sql`
    INSERT INTO downloads (id, downloaded_at, blob_url, file_size)
    VALUES (${id}, CURRENT_TIMESTAMP, ${blobUrl}, ${fileSize || null})
    ON CONFLICT (id) DO NOTHING
  `

  const result = await sql`
    SELECT 
      t.id,
      COALESCE(t.custom_title, t.title) AS title,
      COALESCE(t.custom_artist, t.artist) AS artist,
      t.duration
    FROM tracks t
    WHERE t.id = ${id}
  `

  if (result.length === 0) {
    throw new Error(`Track with id ${id} does not exist`)
  }

  return result[0] as Track
}

export async function unlogDownload(id: string): Promise<void> {
  await sql`DELETE FROM downloads WHERE id = ${id}`
}

export async function isDownloaded(trackId: string): Promise<boolean> {
  const result = await sql`SELECT 1 FROM downloads WHERE id = ${trackId} LIMIT 1`
  return result.length > 0
}

export async function getDownloadsContent(): Promise<Track[]> {
  const result = await sql`
    SELECT 
      t.id,
      COALESCE(t.custom_title, t.title) AS title,
      COALESCE(t.custom_artist, t.artist) AS artist,
      t.duration
    FROM tracks t
    INNER JOIN downloads d ON t.id = d.id
    ORDER BY d.downloaded_at DESC
  `

  return result as Track[]
}

export async function getBlobUrl(trackId: string): Promise<string | null> {
  const result = await sql`
    SELECT blob_url FROM downloads WHERE id = ${trackId} LIMIT 1
  `

  return result.length > 0 ? result[0].blob_url : null
}

// Metadata Operations
export async function setCustomMetadata(
  id: string,
  customTitle?: string,
  customArtist?: string,
): Promise<{ id: string; title: string; artist: string }> {
  await sql`
    UPDATE tracks
    SET 
      custom_title = ${customTitle || null},
      custom_artist = ${customArtist || null}
    WHERE id = ${id}
  `

  const result = await sql`
    SELECT 
      id,
      COALESCE(custom_title, title) AS title,
      COALESCE(custom_artist, artist) AS artist
    FROM tracks
    WHERE id = ${id}
  `

  return result[0] as { id: string; title: string; artist: string }
}

// Search Operations
export async function searchTracks(query: string): Promise<Track[]> {
  if (!query) {
    return getDownloadsContent()
  }

  const searchPattern = `%${query}%`
  const result = await sql`
    SELECT 
      t.id,
      COALESCE(t.custom_title, t.title) AS title,
      COALESCE(t.custom_artist, t.artist) AS artist,
      t.duration
    FROM tracks t
    WHERE 
      t.title ILIKE ${searchPattern}
      OR t.artist ILIKE ${searchPattern}
      OR COALESCE(t.custom_title, t.title) ILIKE ${searchPattern}
      OR COALESCE(t.custom_artist, t.artist) ILIKE ${searchPattern}
    ORDER BY t.title
  `

  return result as Track[]
}

// Like Operations
export async function toggleLike(id: string): Promise<boolean> {
  const existing = await sql`SELECT 1 FROM likes WHERE id = ${id}`

  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE id = ${id}`
    return false
  } else {
    await sql`INSERT INTO likes (id) VALUES (${id})`
    return true
  }
}

export async function fetchLikedTracks(): Promise<string[]> {
  const result = await sql`
    SELECT id FROM likes ORDER BY liked_at ASC
  `

  return result.map((row) => row.id)
}

// Playlist Operations
export async function createPlaylist(name: string): Promise<{ id: number; name: string }> {
  const result = await sql`
    INSERT INTO playlists (name)
    VALUES (${name})
    RETURNING id, name
  `

  return result[0] as { id: number; name: string }
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const result = await sql`
    SELECT id, name, created_at FROM playlists ORDER BY id
  `

  return result as Playlist[]
}

export async function getPlaylistContent(playlistId: number): Promise<{
  id: number
  name: string
  trackIds: string[]
}> {
  const playlistResult = await sql`
    SELECT id, name FROM playlists WHERE id = ${playlistId}
  `

  if (playlistResult.length === 0) {
    return { id: playlistId, name: "", trackIds: [] }
  }

  const tracksResult = await sql`
    SELECT track_id FROM playlist_tracks
    WHERE playlist_id = ${playlistId}
    ORDER BY added_at ASC
  `

  return {
    id: playlistResult[0].id,
    name: playlistResult[0].name,
    trackIds: tracksResult.map((row) => row.track_id),
  }
}

export async function updateTrackPlaylists(
  trackId: string,
  playlistUpdates: Array<{ id: number; checked: boolean }>,
): Promise<void> {
  for (const update of playlistUpdates) {
    if (update.checked === true) {
      await sql`
        INSERT INTO playlist_tracks (playlist_id, track_id)
        VALUES (${update.id}, ${trackId})
        ON CONFLICT (playlist_id, track_id) DO NOTHING
      `
    } else if (update.checked === false) {
      await sql`
        DELETE FROM playlist_tracks
        WHERE playlist_id = ${update.id} AND track_id = ${trackId}
      `
    }
  }
}

export async function editPlaylist(playlistId: number, name: string): Promise<{ id: number; name: string }> {
  await sql`
    UPDATE playlists SET name = ${name} WHERE id = ${playlistId}
  `

  return { id: playlistId, name }
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  await sql`DELETE FROM playlist_tracks WHERE playlist_id = ${playlistId}`
  await sql`DELETE FROM playlists WHERE id = ${playlistId}`
}
