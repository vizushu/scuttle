# Scuttle Migration to Vercel

This guide outlines the migration from the Python/FastAPI backend to Next.js on Vercel.

## Architecture Changes

### Before (Python/FastAPI)
- **Backend**: Python FastAPI with SQLite
- **Frontend**: Vanilla JavaScript
- **Storage**: Local filesystem
- **Jobs**: In-memory queue with background workers
- **Real-time**: WebSockets

### After (Next.js/Vercel)
- **Backend**: Next.js API Routes
- **Frontend**: React components
- **Database**: Neon Postgres (serverless)
- **Storage**: Vercel Blob
- **Jobs**: Vercel Queues
- **Real-time**: Polling / Server-Sent Events

## Required Vercel Integrations

1. **Neon** - Postgres database
2. **Vercel Blob** - Audio file storage
3. **Vercel Queues** - Background download jobs

## Environment Variables

Set these in your Vercel project:

\`\`\`bash
DATABASE_URL=          # Auto-populated by Neon integration
BLOB_READ_WRITE_TOKEN= # Auto-populated by Blob integration
\`\`\`

## Database Schema Migration

The SQL schema has been converted from SQLite to Postgres. Run the migration script:

\`\`\`bash
# This will be created in the next task
npm run db:migrate
\`\`\`

## Key Differences

### Download Process
- **Before**: yt-dlp downloads to local filesystem, stored in `downloads/`
- **After**: Downloads handled by queue worker, uploaded to Vercel Blob

### Audio Streaming
- **Before**: Direct file streaming with range requests
- **After**: Proxy streaming from Vercel Blob URLs

### Real-time Updates
- **Before**: WebSocket connections for live updates
- **After**: Polling or Server-Sent Events (SSE)

## Deployment Steps

1. Connect GitHub repository to Vercel
2. Add Neon integration for database
3. Add Vercel Blob integration for storage
4. Set environment variables
5. Deploy

## Known Limitations

- Download timeout: 60 seconds max (Vercel Pro) - long downloads may need external worker
- Cold starts: First request may be slower
- WebSocket replacement: Polling adds slight latency

## Next Steps

See EVALUATION_PLAN.md for comprehensive testing and improvement roadmap.
