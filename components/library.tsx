"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { Search, Heart, MoreVertical, Play, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/lib/hooks/use-audio-player"
import { toast } from "sonner"
import { debounce } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Track {
  id: string
  title: string
  artist: string | null
  duration: number | null
}

interface YouTubeResult {
  id: string
  title: string
  artist: string
  url: string
  thumbnail: string
  duration: string
  source: string
}

export function Library() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([])
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const { data, mutate } = useSWR<{ tracks: Track[] }>(
    debouncedQuery ? `/api/search?q=${debouncedQuery}` : "/api/search?q=",
    fetcher,
    {
      refreshInterval: 5000,
    },
  )
  const { data: likesData } = useSWR<{ likes: string[] }>("/api/likes", fetcher)
  const { setCurrentTrack, setQueue } = useAudioPlayer()

  const tracks = data?.tracks || []
  const likes = new Set(likesData?.likes || [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query)
      if (query.trim()) {
        searchYouTube(query)
      } else {
        setYoutubeResults([])
        setShowDropdown(false)
      }
    }, 500),
    [],
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const searchYouTube = async (query: string) => {
    setIsSearchingYouTube(true)
    try {
      const response = await fetch(`/api/search/youtube?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      console.log("[v0] YouTube search results:", data)
      setYoutubeResults(data.results || [])
      setShowDropdown(true)
    } catch (error) {
      console.error("[v0] YouTube search failed:", error)
    } finally {
      setIsSearchingYouTube(false)
    }
  }

  const handleDownloadYouTube = async (result: YouTubeResult) => {
    try {
      const response = await fetch("/api/queue/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      })

      if (!response.ok) throw new Error("Failed to enqueue")

      toast.success("Download started! Check your library soon.")
      setShowDropdown(false)
      setSearchQuery("")
    } catch (error) {
      console.error("[v0] Download error:", error)
      toast.error("Failed to start download")
    }
  }

  const handlePlay = (track: Track) => {
    setCurrentTrack(track)
    setQueue(tracks)
  }

  const handleToggleLike = async (trackId: string) => {
    try {
      await fetch("/api/audio/toggle-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trackId }),
      })
      mutate()
      toast.success("Like toggled")
    } catch (error) {
      toast.error("Failed to toggle like")
    }
  }

  const handleDelete = async (trackId: string) => {
    try {
      await fetch("/api/downloads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trackId }),
      })
      mutate()
      toast.success("Track deleted")
    } catch (error) {
      toast.error("Failed to delete track")
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <div className="flex-1" />
          <ThemeToggle />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className="pl-10 w-full"
          />

          {showDropdown && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {tracks.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Your Library</div>
                  {tracks.slice(0, 3).map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        handlePlay(track)
                        setShowDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left"
                    >
                      <Play className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{track.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{track.artist || "Unknown"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {youtubeResults.length > 0 && (
                <div className="p-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1">YouTube Results</div>
                  {youtubeResults.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                      <img
                        src={result.thumbnail || "/placeholder.svg"}
                        alt={result.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{result.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{result.artist}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadYouTube(result)}
                        className="flex-shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {isSearchingYouTube && (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching YouTube...</div>
              )}

              {!isSearchingYouTube && tracks.length === 0 && youtubeResults.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No tracks found in your library." : "No tracks found. Start by searching for music!"}
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlay(track)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <Play className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm md:text-base">{track.title}</div>
                    <div className="text-xs md:text-sm text-muted-foreground truncate">
                      {track.artist || "Unknown Artist"}
                    </div>
                  </div>

                  <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    {formatDuration(track.duration)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleLike(track.id)}
                    className="flex-shrink-0"
                  >
                    <Heart className={`h-4 w-4 ${likes.has(track.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePlay(track)}>Play</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLike(track.id)}>
                        {likes.has(track.id) ? "Unlike" : "Like"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(track.id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
