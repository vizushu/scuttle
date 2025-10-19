# Download Integration Guide

## Overview

The download system has been migrated from Python/yt-dlp to a queue-based architecture using Vercel Queues. However, due to Vercel's serverless limitations, the actual download process requires an external worker.

## Architecture

### Current Implementation

1. **Queue System**: Vercel Queues manages download jobs
2. **API Endpoints**: Accept download requests and enqueue jobs
3. **Placeholder Processor**: Simulates download processing

### What's Missing

The actual yt-dlp download functionality needs to be implemented in one of these ways:

## Option 1: External Worker (Recommended)

Deploy a separate worker service (Railway, Render, or self-hosted) that:

1. Polls the Vercel Queue or listens to webhooks
2. Downloads audio using yt-dlp
3. Uploads to Vercel Blob via API
4. Updates database via API

**Pros:**
- No timeout limitations
- Full yt-dlp functionality
- Can handle long downloads

**Cons:**
- Requires separate infrastructure
- More complex setup

## Option 2: Vercel Functions with Streaming

Use Vercel Functions with streaming to download in chunks:

1. Start download in serverless function
2. Stream chunks to Vercel Blob
3. Handle within 60-second timeout (Pro plan)

**Pros:**
- All on Vercel
- Simpler deployment

**Cons:**
- 60-second limit (may fail for large files)
- More complex implementation

## Option 3: Client-Side Download

Have the browser download and upload:

1. User initiates download in browser
2. Browser downloads audio
3. Browser uploads to Vercel Blob via API

**Pros:**
- No server timeout issues
- Simple implementation

**Cons:**
- Requires user to keep browser open
- CORS limitations
- Not truly "server-side"

## Implementation Steps

### For External Worker (Recommended)

1. **Create Worker Service**
   \`\`\`bash
   # Deploy to Railway/Render
   # Use Python with yt-dlp
   \`\`\`

2. **Worker Code** (Python example)
   \`\`\`python
   import yt_dlp
   import requests
   
   def process_download(job):
       # Download with yt-dlp
       ydl_opts = {
           'format': 'bestaudio/best',
           'outtmpl': f'/tmp/{job["id"]}.%(ext)s'
       }
       
       with yt_dlp.YoutubeDL(ydl_opts) as ydl:
           info = ydl.extract_info(job["query"], download=True)
           
       # Upload to Vercel
       with open(f'/tmp/{job["id"]}.mp3', 'rb') as f:
           requests.post(
               'https://your-app.vercel.app/api/upload',
               files={'file': f},
               data={
                   'trackId': job["id"],
                   'title': info["title"],
                   'artist': info.get("artist"),
                   'duration': info.get("duration")
               }
           )
   \`\`\`

3. **Configure Queue Webhook**
   - Set Vercel Queue to call your worker endpoint
   - Worker processes jobs and uploads results

## Environment Variables

\`\`\`bash
# For external worker
VERCEL_API_URL=https://your-app.vercel.app
VERCEL_API_TOKEN=your-api-token

# For Vercel (if using Option 2)
YTDLP_BINARY_PATH=/var/task/yt-dlp
\`\`\`

## Testing

Test the queue system without actual downloads:

\`\`\`bash
curl -X POST https://your-app.vercel.app/api/queue/enqueue \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "test song",
    "metadata": {
      "title": "Test Song",
      "artist": "Test Artist"
    }
  }'
\`\`\`

## Next Steps

1. Choose implementation option
2. Set up external worker (if Option 1)
3. Implement yt-dlp integration
4. Test with real downloads
5. Add error handling and retries
\`\`\`
