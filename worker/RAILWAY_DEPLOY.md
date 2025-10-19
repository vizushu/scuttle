# Deploy Worker to Railway

## Important: Deploy from the `worker` directory

Railway must deploy from the `worker` folder, not the root of the repository.

## Option 1: Deploy via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `scuttle` repository
4. **IMPORTANT**: In the deployment settings:
   - Set **Root Directory** to `worker`
   - Railway will automatically detect the Dockerfile

5. Add environment variables:
   \`\`\`
   NEON_NEON_DATABASE_URL=postgresql://...
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   POLL_INTERVAL=10
   LOG_LEVEL=INFO
   \`\`\`

6. Deploy!

## Option 2: Deploy via Railway CLI

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to worker directory
cd worker

# Initialize and deploy
railway init
railway up
\`\`\`

## Verify Deployment

After deployment, check the logs for:
\`\`\`
Download processor started
Worker started. Polling every 10 seconds...
\`\`\`

## Troubleshooting

### Error: "TUNNEL_BIN_PATH not found"
- This means Railway is deploying from the root directory instead of `worker`
- Solution: Set Root Directory to `worker` in Railway settings

### Error: "NEON_DATABASE_URL not found"
- Add the environment variable in Railway dashboard
- Get the value from Neon console

### Worker keeps crashing
- Check the logs in Railway dashboard
- Verify all environment variables are set correctly
- Make sure Root Directory is set to `worker`
