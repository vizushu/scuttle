import { neon } from "@neondatabase/serverless"

let _sql: ReturnType<typeof neon> | null = null

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(target, prop) {
    if (!_sql) {
      const databaseUrl = process.env.NEON_NEON_NEON_DATABASE_URL || process.env.DATABASE_URL

      if (!databaseUrl) {
        throw new Error("NEON_DATABASE_URL environment variable is not set")
      }

      _sql = neon(databaseUrl)
    }

    return _sql[prop as keyof typeof _sql]
  },
  apply(target, thisArg, args) {
    if (!_sql) {
      const databaseUrl = process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL

      if (!databaseUrl) {
        throw new Error("NEON_DATABASE_URL environment variable is not set")
      }

      _sql = neon(databaseUrl)
    }

    return (_sql as any)(...args)
  },
})

// Database schema types
export interface Track {
  id: string
  title: string
  artist: string | null
  duration: number | null
  custom_title: string | null
  custom_artist: string | null
}

export interface Download {
  id: string
  downloaded_at: Date
  blob_url: string
}

export interface Playlist {
  id: number
  name: string
  created_at: Date
}

export interface PlaylistTrack {
  playlist_id: number
  track_id: string
  added_at: Date
}

export interface Like {
  id: string
  liked_at: Date
}
