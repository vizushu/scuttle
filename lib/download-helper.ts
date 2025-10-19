import { uploadAudio } from "./blob"
import { logTrack, logDownload } from "./db-operations"

export interface DownloadResult {
  success: boolean
  trackId?: string
  error?: string
}

export async function downloadAndStore(
  trackId: string,
  audioBuffer: Buffer,
  metadata: {
    title: string
    artist?: string
    duration?: number
  },
): Promise<DownloadResult> {
  try {
    // Upload to Vercel Blob
    const { url, size } = await uploadAudio(trackId, audioBuffer)

    // Log track metadata
    await logTrack({
      id: trackId,
      title: metadata.title,
      artist: metadata.artist,
      duration: metadata.duration,
    })

    // Log download
    await logDownload(trackId, url, size)

    return {
      success: true,
      trackId,
    }
  } catch (error) {
    console.error(`[v0] Download and store failed for ${trackId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
