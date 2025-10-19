# Scuttle Deployment Guide - Hybrid Architecture

This guide covers deploying Scuttle with a hybrid architecture:
- **Frontend + API**: Deployed on Vercel
- **Download Worker**: Deployed on Railway/Render

## Architecture Overview

\`\`\`
┌─────────────────┐
│   Vercel        │
│  (Frontend+API) │
│                 │
│  - Next.js UI   │
│  - API Routes   │
│  - Streaming    │
└────────┬────────┘
         │
         │ Shared Resources
         │
    ┌────┴─────┬──────────┐
    │          │          │
┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐
│ Neon   │ │ Vercel │ │ Railway │
│Postgres│ │  Blob  │ │ Worker  │
│        │ │        │ │         │
│Database│ │Storage │ │yt-dlp   │
└────────┘ └────────┘ └─────────┘
\`\`\`

## Prerequisites

1. **Vercel Account** - For frontend hosting
2. **Neon Account** - For PostgreSQL database (free tier available)
3. **Railway or Render Account** - For worker hosting ($5-10/month)
4. **GitHub Account** - For code repository

## Step 1: Setup Database (Neon)

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project: "scuttle-db"
3. Copy the connection string
4. Run the schema migration:

\`\`\`bash
# Install Neon CLI
npm install -g neonctl

# Set your connection string
export NEON_NEON_DATABASE_URL="postgresql://..."

# Run migration
psql $DATABASE_URL -f scripts/001_init_schema.sql
\`\`\`

## Step 2: Setup Blob Storage (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Blob
3. Create a new Blob store: "scuttle-audio"
4. Copy the `BLOB_READ_WRITE_TOKEN`

## Step 3: Deploy Frontend to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Push code to GitHub:
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/scuttle.git
git push -u origin main
\`\`\`

2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL` - From Neon
   - `POSTGRES_URL` - From Neon
   - `BLOB_READ_WRITE_TOKEN` - From Vercel Blob
5. Deploy

### Option B: Deploy via CLI

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add POSTGRES_URL
vercel env add BLOB_READ_WRITE_TOKEN

# Deploy to production
vercel --prod
\`\`\`

## Step 4: Deploy Worker to Railway

### Setup Railway Project

1. Go to [Railway Dashboard](https://railway.app/new)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: Leave empty (Dockerfile is in worker/)
   - **Dockerfile Path**: `worker/Dockerfile`

### Configure Environment Variables

Add these in Railway dashboard:

\`\`\`bash
DATABASE_URL=postgresql://...  # Same as Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # Same as Vercel
POLL_INTERVAL=10  # Worker-specific: Check for downloads every 10 seconds
LOG_LEVEL=INFO    # Worker-specific: Logging level
\`\`\`

### Deploy

Railway will automatically build and deploy. Check logs:

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
\`\`\`

## Step 5: Verify Deployment

### Test Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check that the UI loads
3. Try searching for tracks

### Test Worker

1. Check worker health:
\`\`\`bash
curl https://your-worker.railway.app/health
\`\`\`

2. Check worker stats:
\`\`\`bash
curl https://your-worker.railway.app/stats
\`\`\`

### Test Download Flow

1. In the Scuttle UI, search for a song
2. Click download
3. Check download status in the UI
4. Monitor worker logs in Railway dashboard
5. Verify audio file appears in library after processing

## Step 6: Connect Custom Domain (Optional)

### Vercel Domain

1. Go to Vercel project settings → Domains
2. Add your domain: `scuttle.yourdomain.com`
3. Configure DNS as instructed

### Railway Domain

1. Go to Railway project settings
2. Generate domain or add custom domain
3. Update CORS settings in worker if needed

## Environment Variables Summary

### Vercel (Frontend)
\`\`\`bash
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
\`\`\`

### Railway (Worker)
\`\`\`bash
DATABASE_URL=postgresql://...  # Same as Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # Same as Vercel
POLL_INTERVAL=10  # Worker-specific: Check for downloads every 10 seconds
LOG_LEVEL=INFO    # Worker-specific: Logging level
\`\`\`

## Monitoring

### Vercel Logs
\`\`\`bash
vercel logs --follow
\`\`\`

### Railway Logs
\`\`\`bash
railway logs --follow
\`\`\`

### Database Monitoring

Check download queue status:
\`\`\`sql
SELECT status, COUNT(*) 
FROM downloads 
GROUP BY status;
\`\`\`

## Troubleshooting

### Worker Not Processing Downloads

1. Check worker is running: `curl https://worker-url/health`
2. Check database connection in worker logs
3. Verify `DATABASE_URL` is correct
4. Check for pending downloads: `SELECT * FROM downloads WHERE status='pending'`

### Blob Upload Failures

1. Verify `BLOB_READ_WRITE_TOKEN` is set in worker
2. Check worker has internet access
3. Check Vercel Blob storage limits

### Database Connection Issues

1. Verify Neon database is active
2. Check connection string format
3. Ensure database allows connections from Railway IPs
4. Check Neon connection pooling settings

## Scaling

### Increase Worker Capacity

Railway:
\`\`\`bash
# Scale to 2 workers
railway up --replicas 2
\`\`\`

### Optimize Database

1. Add indexes for frequently queried fields
2. Enable connection pooling in Neon
3. Monitor query performance

### Optimize Blob Storage

1. Implement cleanup for old files
2. Use CDN for audio streaming
3. Compress audio files before upload

## Cost Estimates

- **Vercel**: Free (Hobby) or $20/month (Pro)
- **Neon**: Free (0.5GB) or $19/month (Pro)
- **Railway**: ~$5-10/month (based on usage)
- **Total**: $0-50/month depending on tier

## Backup Strategy

### Database Backups

Neon provides automatic backups. To manually backup:

\`\`\`bash
pg_dump $DATABASE_URL > backup.sql
\`\`\`

### Blob Storage Backups

Download all audio files:

\`\`\`bash
# Use Vercel Blob CLI or API to list and download
\`\`\`

## Updates and Maintenance

### Update Frontend

\`\`\`bash
git pull
vercel --prod
\`\`\`

### Update Worker

\`\`\`bash
git pull
railway up
\`\`\`

### Update Dependencies

\`\`\`bash
# Frontend
npm update

# Worker
pip install -r worker/requirements.txt --upgrade
\`\`\`

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] Database has strong password
- [ ] Blob storage token is kept secret
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive info

## Next Steps

1. Add user authentication
2. Implement rate limiting
3. Add download history cleanup
4. Set up monitoring alerts
5. Configure CDN for audio streaming
6. Add analytics
