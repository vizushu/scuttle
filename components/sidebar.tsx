"use client"

import { useState } from "react"
import useSWR from "swr"
import { Music, Heart, ListMusic, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Playlist {
  id: number
  name: string
}

export function Sidebar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [playlistName, setPlaylistName] = useState("")
  const { data, mutate } = useSWR<{ playlists: Playlist[] }>("/api/playlists", fetcher)

  const playlists = data?.playlists || []

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) return

    try {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playlistName }),
      })

      mutate()
      setPlaylistName("")
      setIsCreateOpen(false)
      toast.success("Playlist created")
    } catch (error) {
      toast.error("Failed to create playlist")
    }
  }

  return (
    <div className="w-full md:w-64 border-r bg-card flex flex-col">
      <div className="p-4 md:p-6 border-b flex items-center justify-between md:justify-between">
        <div className="flex items-center gap-3 mx-auto md:mx-0">
          <Image
            src="/scuttle-logo.png"
            alt="Scuttle"
            width={120}
            height={40}
            className="h-8 w-auto"
            style={{ background: "transparent" }}
          />
        </div>
        <ThemeToggle className="hidden md:flex" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Music className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Library</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Heart className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Liked Songs</span>
            </Button>
          </div>

          {/* Playlists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground hidden md:block">Playlists</h3>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Playlist Name</Label>
                      <Input
                        id="name"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder="My Awesome Playlist"
                      />
                    </div>
                    <Button onClick={handleCreatePlaylist} className="w-full">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-1">
              {playlists.map((playlist) => (
                <Button key={playlist.id} variant="ghost" className="w-full justify-start">
                  <ListMusic className="mr-2 h-4 w-4" />
                  <span className="hidden md:inline truncate">{playlist.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
