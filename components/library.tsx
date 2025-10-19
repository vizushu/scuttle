"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, Heart, MoreVertical, Play } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/lib/hooks/use-audio-player"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Track {
  id: string
  title: string
  artist: string | null
  duration: number | null
}

export function Library() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data, mutate } = useSWR<{ tracks: Track[] }>(`/api/search?q=${searchQuery}`, fetcher, {
    refreshInterval: 5000,
  })
  const { data: likesData } = useSWR<{ likes: string[] }>("/api/likes", fetcher)
  const { setCurrentTrack, setQueue } = useAudioPlayer()

  const tracks = data?.tracks || []
  const likes = new Set(likesData?.likes || [])

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
      {/* Search Bar */}
      <div className="p-6 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {tracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tracks found. Start by adding some music!</div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent group">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlay(track)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{track.artist || "Unknown Artist"}</div>
                  </div>

                  <div className="text-sm text-muted-foreground">{formatDuration(track.duration)}</div>

                  <Button variant="ghost" size="icon" onClick={() => handleToggleLike(track.id)}>
                    <Heart className={`h-4 w-4 ${likes.has(track.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
