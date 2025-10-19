import { put, del, list } from "@vercel/blob"

export async function uploadAudio(
  trackId: string,
  audioBuffer: Buffer,
  contentType = "audio/mpeg",
): Promise<{ url: string; size: number }> {
  const blob = await put(`audio/${trackId}`, audioBuffer, {
    access: "public",
    contentType,
    addRandomSuffix: false, // Use consistent naming
  })

  return {
    url: blob.url,
    size: blob.size,
  }
}

export async function deleteAudio(trackId: string): Promise<void> {
  const blobs = await list({ prefix: `audio/${trackId}` })

  for (const blob of blobs.blobs) {
    await del(blob.url)
  }
}

export async function getAudioUrl(trackId: string): Promise<string | null> {
  const blobs = await list({ prefix: `audio/${trackId}`, limit: 1 })

  if (blobs.blobs.length === 0) {
    return null
  }

  return blobs.blobs[0].url
}

export async function getAudioMetadata(trackId: string): Promise<{
  url: string
  size: number
  uploadedAt: Date
} | null> {
  const blobs = await list({ prefix: `audio/${trackId}`, limit: 1 })

  if (blobs.blobs.length === 0) {
    return null
  }

  const blob = blobs.blobs[0]

  return {
    url: blob.url,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }
}

export async function audioExists(trackId: string): Promise<boolean> {
  const blobs = await list({ prefix: `audio/${trackId}`, limit: 1 })
  return blobs.blobs.length > 0
}

export async function listAllAudio(): Promise<
  Array<{
    trackId: string
    url: string
    size: number
    uploadedAt: Date
  }>
> {
  const blobs = await list({ prefix: "audio/" })

  return blobs.blobs.map((blob) => ({
    trackId: blob.pathname.replace("audio/", ""),
    url: blob.url,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }))
}

// Cleanup orphaned blobs (audio files without database entries)
export async function cleanupOrphanedBlobs(validTrackIds: Set<string>): Promise<number> {
  const allBlobs = await listAllAudio()
  let deletedCount = 0

  for (const blob of allBlobs) {
    if (!validTrackIds.has(blob.trackId)) {
      await del(blob.url)
      deletedCount++
      console.log(`[v0] Deleted orphaned blob: ${blob.trackId}`)
    }
  }

  return deletedCount
}
