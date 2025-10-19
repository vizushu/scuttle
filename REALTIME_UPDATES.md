# Real-time Updates Implementation

## Overview

The original Scuttle application used WebSockets for real-time updates. Since Vercel has limited WebSocket support, we've implemented two alternative approaches:

## Approach 1: SWR Polling (Current Implementation)

**How it works:**
- Uses SWR's `refreshInterval` option to poll endpoints every 2-5 seconds
- Automatically revalidates data when user focuses the tab
- Simple and reliable for most use cases

**Pros:**
- Easy to implement
- Works everywhere
- No connection management needed
- Automatic deduplication

**Cons:**
- Slight delay (2-5 seconds)
- More API calls than WebSockets
- Not truly "real-time"

**Usage:**
\`\`\`typescript
const { data } = useSWR('/api/downloads', fetcher, {
  refreshInterval: 5000, // Poll every 5 seconds
  revalidateOnFocus: true,
})
\`\`\`

## Approach 2: Server-Sent Events (SSE)

**How it works:**
- Server pushes updates to client via HTTP streaming
- One-way communication (server → client)
- Automatically reconnects on disconnect

**Pros:**
- Lower latency than polling
- Fewer requests than polling
- Native browser support

**Cons:**
- One-way only (no client → server messages)
- Connection limits (6 per domain in browsers)
- Requires keeping connection open

**Usage:**
\`\`\`typescript
const { isConnected, lastEvent } = useSSE('/api/events')
\`\`\`

## Comparison with Original WebSocket Implementation

| Feature | WebSockets (Original) | SWR Polling (Current) | SSE (Alternative) |
|---------|----------------------|----------------------|-------------------|
| Latency | ~100ms | 2-5 seconds | ~500ms |
| Bi-directional | Yes | No | No |
| Connection overhead | Low | Medium | Low |
| Vercel support | Limited | Full | Full |
| Implementation complexity | High | Low | Medium |

## Recommended Approach

For most use cases, **SWR polling** is recommended because:
1. Simple to implement and maintain
2. Works reliably on Vercel
3. 2-5 second delay is acceptable for music library updates
4. Automatic error handling and retry logic

Use **SSE** if you need:
- Lower latency updates
- Real-time download progress
- Immediate notification of new tracks

## Future Improvements

If you need true real-time updates:
1. Use Vercel's Edge Functions with WebSocket support (experimental)
2. Deploy a separate WebSocket server (Railway/Render)
3. Use a third-party service (Pusher, Ably, etc.)

## Implementation Details

### Current Setup

1. **Global polling**: `useRealtimeUpdates()` hook revalidates all SWR caches every 5 seconds
2. **Component-level polling**: Individual components set their own `refreshInterval`
3. **Focus revalidation**: Data refreshes when user returns to tab

### Adding SSE (Optional)

To enable SSE for specific components:

\`\`\`typescript
import { useSSE } from '@/lib/hooks/use-sse'

function MyComponent() {
  const { isConnected, lastEvent } = useSSE('/api/events')
  
  useEffect(() => {
    if (lastEvent?.type === 'download_complete') {
      // Handle event
      mutate('/api/downloads')
    }
  }, [lastEvent])
}
\`\`\`

## Performance Considerations

- **Polling interval**: Balance between freshness and API load
- **Conditional polling**: Only poll when tab is visible
- **Debouncing**: Prevent excessive revalidation
- **Caching**: SWR handles this automatically

\`\`\`typescript
const { data } = useSWR('/api/downloads', fetcher, {
  refreshInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Prevent duplicate requests within 2s
})
\`\`\`
\`\`\`
