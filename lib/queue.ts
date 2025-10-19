import { sql } from "./db"

export interface DownloadJob {
  id?: string
  url: string
  title?: string
  status?: "pending" | "processing" | "completed" | "failed"
}

export async function enqueueDownload(url: string, title?: string): Promise<string> {
  const result = await sql`
    INSERT INTO downloads (url, title, status, created_at, updated_at)
    VALUES (${url}, ${title || "Unknown"}, 'pending', NOW(), NOW())
    RETURNING id
  `

  const downloadId = result.rows[0].id
  console.log(`[v0] Enqueued download:`, downloadId)

  return downloadId
}

export async function getQueueStatus(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
}> {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM downloads
    `

    const stats = result.rows[0]
    return {
      pending: Number.parseInt(stats.pending) || 0,
      processing: Number.parseInt(stats.processing) || 0,
      completed: Number.parseInt(stats.completed) || 0,
      failed: Number.parseInt(stats.failed) || 0,
    }
  } catch (error) {
    console.error("[v0] Failed to get queue stats:", error)
    return { pending: 0, processing: 0, completed: 0, failed: 0 }
  }
}

export async function getDownloadById(id: string) {
  const result = await sql`
    SELECT d.*, t.title as track_title, t.file_path
    FROM downloads d
    LEFT JOIN tracks t ON d.track_id = t.id
    WHERE d.id = ${id}
  `

  return result.rows[0] || null
}

export async function getRecentDownloads(limit = 20) {
  const result = await sql`
    SELECT d.*, t.title as track_title, t.file_path
    FROM downloads d
    LEFT JOIN tracks t ON d.track_id = t.id
    ORDER BY d.created_at DESC
    LIMIT ${limit}
  `

  return result.rows
}

export async function clearQueue(): Promise<void> {
  await sql`
    DELETE FROM downloads
    WHERE status IN ('pending', 'failed')
  `

  console.log("[v0] Queue cleared (removed pending and failed downloads)")
}
