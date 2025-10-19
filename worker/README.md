# Scuttle Download Worker

Background worker service for processing yt-dlp downloads.

## Features

- Polls Neon Postgres database for pending downloads
- Downloads audio using yt-dlp
- Uploads to Vercel Blob storage
- Updates database with results
- Health check and stats endpoints

## Architecture

\`\`\`
┌──────────────┐
│   Database   │
│   (Neon)     │
└──────┬───────┘
       │
       │ Poll every 10s
       │
┌──────▼───────┐
│   Worker     │
│              │
│  1. Fetch    │
│  2. Download │
│  3. Upload   │
│  4. Update   │
└──────┬───────┘
       │
       │ Upload
       │
┌──────▼───────┐
│ Vercel Blob  │
└──────────────┘
\`\`\`

## Local Development

### Prerequisites

- Python 3.11+
- ffmpeg
- PostgreSQL (or Neon connection)

### Setup

\`\`\`bash
cd worker

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run worker
python -m uvicorn worker.main:app --reload
\`\`\`

### Test Endpoints

\`\`\`bash
# Health check
curl http://localhost:8000/health

# Get stats
curl http://localhost:8000/stats

# Trigger processing
curl -X POST http://localhost:8000/process-now
\`\`\`

## Deployment

### Railway

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
\`\`\`

### Render

1. Connect GitHub repository
2. Select `worker` directory
3. Use `worker/render.yaml` configuration
4. Add environment variables
5. Deploy

### Docker

\`\`\`bash
# Build
docker build -f worker/Dockerfile -t scuttle-worker .

# Run
docker run -p 8000:8000 \
  -e NEON_DATABASE_URL="postgresql://..." \
  -e BLOB_READ_WRITE_TOKEN="..." \
  scuttle-worker
\`\`\`

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (required)
- `POLL_INTERVAL` - Seconds between polls (default: 10)
- `LOG_LEVEL` - Logging level (default: INFO)

### yt-dlp Options

Edit `worker/core/download_processor.py` to customize:

\`\`\`python
ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',  # Change quality here
    }],
}
\`\`\`

## Monitoring

### Logs

\`\`\`bash
# Railway
railway logs --follow

# Render
# View in dashboard

# Docker
docker logs -f container_id
\`\`\`

### Metrics

Access `/stats` endpoint:

\`\`\`json
{
  "is_running": true,
  "poll_interval": 10,
  "pending": 5,
  "processing": 1,
  "completed": 42,
  "failed": 2
}
\`\`\`

## Troubleshooting

### Worker Not Starting

- Check Python version: `python --version`
- Verify ffmpeg installed: `ffmpeg -version`
- Check environment variables are set

### Downloads Failing

- Check yt-dlp is up to date: `pip install -U yt-dlp`
- Verify URL is valid
- Check ffmpeg is working
- Review worker logs for errors

### Blob Upload Failing

- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check network connectivity
- Ensure Blob storage has space

### Database Connection Issues

- Verify `DATABASE_URL` format
- Check database is accessible
- Ensure SSL is configured if required

## Performance Tuning

### Concurrent Downloads

Modify `process_pending_downloads()` to process multiple at once:

\`\`\`python
# Process up to 3 downloads concurrently
result = await conn.fetch("""
    SELECT * FROM downloads
    WHERE status = 'pending'
    LIMIT 3
""")
\`\`\`

### Poll Interval

Adjust based on load:

\`\`\`bash
# Fast polling (every 5 seconds)
POLL_INTERVAL=5

# Slow polling (every 30 seconds)
POLL_INTERVAL=30
\`\`\`

### Memory Usage

For large files, consider streaming uploads instead of loading entire file into memory.

## Security

- Never commit `.env` file
- Rotate tokens regularly
- Use read-only database user if possible
- Implement rate limiting for API endpoints
- Monitor for suspicious download patterns

## License

Same as main Scuttle project
