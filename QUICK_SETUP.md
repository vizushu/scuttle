# Quick Setup Guide for Scuttle

## Step 1: Run Database Migration

You have **3 options** to set up the database:

### Option A: Use the API Route (Easiest)

After deploying to Vercel:

1. Go to: `https://your-app.vercel.app/api/admin/migrate`
2. Send a POST request (use Postman, curl, or browser extension)
   \`\`\`bash
   curl -X POST https://your-app.vercel.app/api/admin/migrate
   \`\`\`
3. You should see: `{"success": true, "message": "Database migration completed successfully"}`

### Option B: Run in Neon Dashboard (Recommended)

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Click "SQL Editor"
4. Copy and paste the SQL from `scripts/001_init_schema.sql`
5. Click "Run"

### Option C: Run Locally (If you have env vars)

1. Create `.env.local` file:
   \`\`\`env
   NEON_NEON_DATABASE_URL=your_neon_connection_string
   BLOB_READ_WRITE_TOKEN=your_blob_token
   \`\`\`
2. Run:
   \`\`\`bash
   npm run db:migrate
   \`\`\`

## Step 2: Deploy Python Worker to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set **Root Directory** to: `worker`
5. Add environment variables:
   \`\`\`
   DATABASE_URL=your_neon_connection_string
   BLOB_READ_WRITE_TOKEN=your_blob_token
   POLL_INTERVAL=10
   LOG_LEVEL=INFO
   \`\`\`
6. Deploy!

**Get your connection strings:**
- Neon: From [Neon Console](https://console.neon.tech/) → Your Project → Connection Details
- Blob: From Vercel → Your Project → Storage → Blob → Show Token

## Step 3: Verify Everything Works

1. Open your Vercel app
2. Try searching for a song
3. Click download
4. Check Railway logs to see the worker processing it
5. Once downloaded, it should appear in your library

## Troubleshooting

**"NEON_DATABASE_URL not set" error:**
- Make sure you've connected the Neon integration in Vercel
- Check Vercel → Settings → Environment Variables

**Downloads not working:**
- Check Railway logs for errors
- Verify worker has correct DATABASE_URL and BLOB_READ_WRITE_TOKEN
- Make sure worker is running (check Railway dashboard)

**Worker can't connect to database:**
- Use the **connection string** from Neon, not the pooled URL
- Format: `postgresql://user:password@host/database`

## What Each Service Does

- **Vercel (Frontend)**: Hosts the web UI, handles API requests, streams audio
- **Railway (Worker)**: Polls database for download jobs, runs yt-dlp, uploads to Blob
- **Neon (Database)**: Stores tracks, playlists, download queue
- **Vercel Blob (Storage)**: Stores the actual audio files

## Cost Estimate

- Vercel: Free (Hobby plan)
- Railway: ~$5/month (500 hours)
- Neon: Free (0.5GB storage)
- Vercel Blob: Free (1GB storage)

**Total: ~$5/month** (or free if you stay within limits)
