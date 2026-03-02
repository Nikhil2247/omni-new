# WebSocket Configuration Guide

This document explains the WebSocket setup for real-time notifications and messaging in the Omnicassion application.

## Overview

The application uses Socket.IO for real-time WebSocket communication. The configuration is environment-aware and automatically adapts to development and production environments.

## Environment Variables

### Required Variables

Add these to your `.env.local` (development) or production environment:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WebSocket URL (optional - derived from API_URL if not provided)
# IMPORTANT: Use HTTP/HTTPS, NOT ws/wss - Socket.IO handles WebSocket upgrade internally
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Socket.IO path (optional - defaults to /api/socket.io)
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io
```

### Production Configuration

For production, use HTTPS protocol (Socket.IO will upgrade to secure WebSocket automatically):

```env
# Production API URL
NEXT_PUBLIC_API_URL=https://api.omnicassion.com/api

# Production WebSocket URL
# IMPORTANT: Use HTTPS, NOT wss - Socket.IO handles secure WebSocket upgrade internally
NEXT_PUBLIC_WS_URL=https://api.omnicassion.com

# Socket.IO path
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io
```

## How It Works

### Automatic URL Resolution

The WebSocket configuration utility automatically determines the correct URL:

1. **Explicit WS_URL**: If `NEXT_PUBLIC_WS_URL` is set, it uses that
2. **Derived from API_URL**: Extracts base URL from `http(s)://host/api` → `http(s)://host`
3. **Browser-based detection**: Uses `window.location` with proper protocol
4. **Fallback**: Defaults to `http://localhost:3001` for development

### Protocol Handling

**IMPORTANT**: Socket.IO expects HTTP/HTTPS URLs, NOT ws/wss URLs.

- Socket.IO automatically handles WebSocket upgrade protocol internally
- Pass `http://` for development, `https://` for production
- Socket.IO will upgrade to `ws://` or `wss://` as appropriate
- No manual protocol conversion needed

### Development vs Production

**Development** (localhost):
- Uses `http://` URL (Socket.IO upgrades to `ws://` automatically)
- Backend on port 3001
- Frontend on port 3000
- Longer reconnection attempts for debugging

**Production**:
- Uses `https://` URL (Socket.IO upgrades to `wss://` automatically)
- Same host for frontend and backend
- Shorter reconnection timeouts
- Better error handling

## Features

### Authentication

WebSocket connections are authenticated using JWT tokens:

```typescript
const config = getWebSocketConfig('/notifications', accessToken)
```

### Reconnection Strategy

Automatic reconnection with exponential backoff:
- **Attempts**: 5 (production) / 10 (development)
- **Initial delay**: 1s (production) / 2s (development)
- **Max delay**: 5s (production) / 10s (development)
- **Randomization**: 0.5 factor to prevent thundering herd

### Transport Fallback

The client tries transports in order:
1. **WebSocket**: Primary, low-latency transport
2. **Polling**: Fallback for restrictive networks/firewalls

## Usage

### Using the Hook

```typescript
import { useNotifications } from '@/hooks/use-notifications'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    connected,
    connectionError,
    markRead,
    markAllRead,
  } = useNotifications()

  if (connectionError) {
    return <div>Error: {connectionError}</div>
  }

  if (!connected) {
    return <div>Connecting to notification service...</div>
  }

  // Render notifications
}
```

### Using the Socket Client Directly

```typescript
import { SocketClient } from '@/lib/websocket/socket-client'

const client = new SocketClient({
  namespace: '/notifications',
  reconnection: true,
  reconnectionAttempts: 5,
})

// Connect with authentication
client.connect(accessToken)

// Listen for events
client.on('notification', (data) => {
  console.log('New notification:', data)
})

// Emit events
client.emit('mark:read', { notificationIds: ['id1', 'id2'] })

// Disconnect when done
client.disconnect()
```

## Troubleshooting

### WebSocket Connection Fails

**Symptoms**: Console shows `WebSocket connection to 'ws://localhost:3001/api/socket.io/' failed`

**Solutions**:

1. **Backend not running**: Ensure the backend server is running on port 3001
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Wrong URL**: Check that `NEXT_PUBLIC_API_URL` is set correctly
   ```bash
   # Development
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **CORS issues**: Backend should allow your frontend origin. Check backend `.env`:
   ```bash
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Firewall/Proxy**: WebSocket might be blocked. Check browser console for detailed errors.

### Connection Works But Authentication Fails

**Symptoms**: Connected but not receiving user-specific notifications

**Solutions**:

1. **Invalid token**: Ensure you're passing a valid JWT token
2. **Token expired**: Tokens may expire, implement refresh logic
3. **Backend validation**: Check backend logs for authentication errors

### Slow Reconnection

**Symptoms**: Takes long to reconnect after disconnection

**Solutions**:

1. **Check network**: Ensure stable internet connection
2. **Review reconnection config**: May need to adjust timeouts
3. **Backend health**: Ensure backend is responsive

### Production Issues

**Common production issues**:

1. **HTTP/HTTPS mixed content**: Always use HTTPS URLs in production (Socket.IO will upgrade to WSS)
2. **Wrong protocol**: Use `https://`, NOT `wss://` - Socket.IO handles WebSocket upgrade
3. **Load balancer**: Ensure WebSocket support is enabled
4. **Reverse proxy**: Configure proper WebSocket headers:
   ```nginx
   location /api/socket.io/ {
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     proxy_set_header Host $host;
   }
   ```

## Disabling WebSockets

To disable WebSocket features (e.g., for testing):

```env
NEXT_PUBLIC_DISABLE_WEBSOCKET=true
```

The app will fall back to HTTP polling for notifications.

## Backend Configuration

Ensure your backend has proper WebSocket setup in `main.ts`:

```typescript
// Enable CORS for WebSocket
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
})
```

And the gateway is properly configured in `notification.gateway.ts`:

```typescript
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: allowedOrigins, credentials: true },
  transports: ['websocket', 'polling'],
})
```

## Monitoring

### Connection Status

Monitor connection status in components:

```typescript
const { connected, connectionError } = useNotifications()

useEffect(() => {
  if (connected) {
    console.log('✓ WebSocket connected')
  } else if (connectionError) {
    console.error('✗ WebSocket error:', connectionError)
  }
}, [connected, connectionError])
```

### Network Tab

Check browser DevTools > Network tab:
- Filter by "WS" to see WebSocket connections
- Inspect frames for message flow
- Check connection timing

## Best Practices

1. **Always authenticate**: Never connect without a valid token
2. **Handle disconnects gracefully**: Show UI feedback when disconnected
3. **Cleanup on unmount**: Always disconnect in useEffect cleanup
4. **Error boundaries**: Wrap WebSocket components in error boundaries
5. **Progressive enhancement**: App should work without WebSocket (polling fallback)
6. **Monitor in production**: Track connection errors and success rates

## Further Reading

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [WebSocket Protocol RFC 6455](https://tools.ietf.org/html/rfc6455)
- [NestJS WebSocket Gateway](https://docs.nestjs.com/websockets/gateways)
