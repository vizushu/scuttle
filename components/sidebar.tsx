"use client"

import { useState } from "react"
import useSWR from "swr"
import { Music, Heart, ListMusic, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <div className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Music className="h-6 w-6" />
          Scuttle
        </h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Music className="mr-2 h-4 w-4" />
              Library
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Heart className="mr-2 h-4 w-4" />
              Liked Songs
            </Button>
          </div>

          {/* Playlists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Playlists</h3>
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
                  {playlist.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}
