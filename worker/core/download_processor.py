import asyncio
import logging
import yt_dlp
from datetime import datetime
from typing import Optional
from worker.core.database import get_db_connection
from worker.core.blob_uploader import upload_to_blob

logger = logging.getLogger(__name__)

class DownloadProcessor:
    def __init__(self, poll_interval: int = 10):
        self.poll_interval = poll_interval
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        
    async def start(self):
        """Start the download processor"""
        self.is_running = True
        self._task = asyncio.create_task(self._poll_loop())
        
    async def stop(self):
        """Stop the download processor"""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
    
    async def _poll_loop(self):
        """Main polling loop"""
        logger.info(f"Starting download processor (polling every {self.poll_interval}s)")
        
        while self.is_running:
            try:
                await self.process_pending_downloads()
            except Exception as e:
                logger.error(f"Error in poll loop: {e}", exc_info=True)
            
            await asyncio.sleep(self.poll_interval)
    
    async def process_pending_downloads(self):
        """Process all pending downloads"""
        conn = await get_db_connection()
        
        try:
            # Get pending downloads
            result = await conn.fetch("""
                SELECT id, url, title, status, created_at
                FROM downloads
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 5
            """)
            
            if not result:
                return
            
            logger.info(f"Found {len(result)} pending downloads")
            
            for download in result:
                await self._process_download(download)
                
        finally:
            await conn.close()
    
    async def _process_download(self, download):
        """Process a single download"""
        download_id = download['id']
        url = download['url']
        
        logger.info(f"Processing download {download_id}: {url}")
        
        conn = await get_db_connection()
        
        try:
            # Update status to processing
            await conn.execute("""
                UPDATE downloads
                SET status = 'processing', updated_at = NOW()
                WHERE id = $1
            """, download_id)
            
            # Download with yt-dlp
            audio_data, metadata = await self._download_audio(url)
            
            if not audio_data:
                raise Exception("Failed to download audio")
            
            # Upload to Vercel Blob
            blob_url = await upload_to_blob(
                audio_data,
                f"{metadata['id']}.{metadata['ext']}",
                content_type=f"audio/{metadata['ext']}"
            )
            
            # Create track record
            track_id = await conn.fetchval("""
                INSERT INTO tracks (
                    title, artist, album, duration, file_path, 
                    file_size, thumbnail_url, source_url, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING id
            """,
                metadata.get('title', 'Unknown'),
                metadata.get('artist') or metadata.get('uploader', 'Unknown'),
                metadata.get('album', ''),
                metadata.get('duration', 0),
                blob_url,
                len(audio_data),
                metadata.get('thumbnail'),
                url
            )
            
            # Update download status
            await conn.execute("""
                UPDATE downloads
                SET status = 'completed', 
                    track_id = $1,
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = $2
            """, track_id, download_id)
            
            logger.info(f"Successfully processed download {download_id} -> track {track_id}")
            
        except Exception as e:
            logger.error(f"Error processing download {download_id}: {e}", exc_info=True)
            
            # Update status to failed
            await conn.execute("""
                UPDATE downloads
                SET status = 'failed',
                    error_message = $1,
                    updated_at = NOW()
                WHERE id = $2
            """, str(e), download_id)
            
        finally:
            await conn.close()
    
    async def _download_audio(self, url: str) -> tuple[bytes, dict]:
        """Download audio using yt-dlp"""
        import tempfile
        import os
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': '%(id)s.%(ext)s',
            'quiet': True,
            'no_warnings': True,
        }
        
        # Create temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            ydl_opts['outtmpl'] = os.path.join(temp_dir, ydl_opts['outtmpl'])
            
            # Download
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
                # Find the downloaded file
                filename = ydl.prepare_filename(info)
                # Replace extension with mp3 (after post-processing)
                filename = os.path.splitext(filename)[0] + '.mp3'
                
                # Read file
                with open(filename, 'rb') as f:
                    audio_data = f.read()
                
                # Extract metadata
                metadata = {
                    'id': info.get('id'),
                    'title': info.get('title'),
                    'artist': info.get('artist') or info.get('uploader'),
                    'album': info.get('album'),
                    'duration': info.get('duration'),
                    'thumbnail': info.get('thumbnail'),
                    'ext': 'mp3'
                }
                
                return audio_data, metadata
    
    async def get_stats(self) -> dict:
        """Get processor statistics"""
        conn = await get_db_connection()
        
        try:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'processing') as processing,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM downloads
            """)
            
            return {
                "is_running": self.is_running,
                "poll_interval": self.poll_interval,
                "pending": stats['pending'],
                "processing": stats['processing'],
                "completed": stats['completed'],
                "failed": stats['failed']
            }
            
        finally:
            await conn.close()
