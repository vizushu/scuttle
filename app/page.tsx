import { AudioPlayer } from "@/components/audio-player"
import { Library } from "@/components/library"
import { Sidebar } from "@/components/sidebar"
import { QueueStatus } from "@/components/queue-status"

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Library />
        </main>
      </div>
      <AudioPlayer />
      <QueueStatus />
    </div>
  )
}
