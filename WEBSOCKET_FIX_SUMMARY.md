# WebSocket Connection Fix - Summary

## Problem

WebSocket connections were failing with the error:
```
WebSocket connection to 'ws://localhost:3001/api/socket.io/?EIO=4&transport=websocket' failed
```

## Root Causes

1. Missing `NEXT_PUBLIC_SOCKET_PATH` in frontend `.env.local`
2. **CRITICAL**: WebSocket config was converting `http://` to `ws://` protocol, but Socket.IO expects HTTP/HTTPS URLs
3. No centralized WebSocket configuration for environment handling
4. Limited error handling and fallback mechanisms
5. No comprehensive documentation for troubleshooting

## Solutions Implemented

### 1. Updated Frontend Environment Configuration

**File**: `frontend/.env.local`

Added missing configuration:
```env
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io
```

### 2. Fixed Protocol Handling in WebSocket Configuration

**File**: `frontend/src/lib/websocket/config.ts`

**CRITICAL FIX**: Socket.IO expects HTTP/HTTPS URLs, NOT ws/wss URLs.

Changed protocol handling:
```typescript
// BEFORE (WRONG):
return baseUrl.replace(/^http/, 'ws')  // http://... → ws://...

// AFTER (CORRECT):
return apiUrl.replace(/\/api\/?$/, '')  // Keep as http://...
```

Socket.IO automatically handles WebSocket protocol upgrade internally:
- `http://localhost:3001` → upgrades to `ws://localhost:3001` automatically
- `https://api.example.com` → upgrades to `wss://api.example.com` automatically

### 3. Created Centralized WebSocket Configuration Utility

**File**: `frontend/src/lib/websocket/config.ts`

New utility that:
- Automatically detects development vs production environment
- **Uses HTTP/HTTPS protocols** (not ws/wss) for Socket.IO compatibility
- Provides consistent configuration across all WebSocket clients
- Includes reconnection strategies optimized per environment
- Supports disabling WebSocket via environment variable

Key features:
```typescript
// Automatic environment detection
const config = getWebSocketConfig('/notifications', token)

// Returns proper configuration for current environment:
// - Development: http://localhost:3001/notifications (Socket.IO upgrades to ws://)
// - Production: https://api.omnicassion.com/notifications (Socket.IO upgrades to wss://)
```

### 4. Enhanced use-notifications Hook

**File**: `frontend/src/hooks/use-notifications.ts`

Improvements:
- Uses centralized configuration utility
- Added comprehensive error handling
- Tracks connection errors with user-friendly messages
- Better logging for debugging in development
- Proper cleanup on unmount
- Returns `connectionError` state for UI feedback

New return values:
```typescript
const { connectionError, ...rest } = useNotifications()

// connectionError contains user-friendly error messages
// Can be used to show connection status in UI
```

### 5. Updated Socket Client

**File**: `frontend/src/lib/websocket/socket-client.ts`

- Now uses centralized WebSocket configuration
- Consistent behavior across all socket connections
- Better error logging

### 6. Improved Backend CORS for Development

**File**: `backend/src/main.ts`

- Added special handling for development mode
- Automatically allows all `localhost:*` and `127.0.0.1:*` origins in development
- Maintains strict security in production

### 7. Created Comprehensive Documentation

**File**: `frontend/WEBSOCKET.md`

Complete guide covering:
- **Correct protocol usage** (HTTP/HTTPS for Socket.IO, not ws/wss)
- Configuration for development and production
- How the URL resolution works
- Authentication and reconnection strategies
- Usage examples
- Troubleshooting guide
- Best practices

## Testing Instructions

### 1. Restart Frontend Development Server

The environment variable changes require a restart:

```bash
cd frontend
npm run dev
```

### 2. Verify Environment Variables

Check that the following are set in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io
```

**IMPORTANT**: Use `http://`, NOT `ws://` for the WS_URL!

### 3. Check Backend is Running

Ensure the backend is running:

```bash
cd backend
npm run start:dev
```

The backend should show:
```
🚀 Application running on: http://0.0.0.0:3001
```

### 4. Test WebSocket Connection

1. Open the frontend at `http://localhost:3000`
2. Log in to authenticate
3. Open browser DevTools (F12)
4. Check the Console tab for connection messages:
   - ✅ `[Notifications] WebSocket connected` - Success!
   - ❌ `[Notifications] WebSocket connection error` - Check troubleshooting

5. Check the Network tab:
   - Filter by "WS" to see WebSocket connections
   - Should see a connection to `ws://localhost:3001/api/socket.io/`
   - Status should be "101 Switching Protocols"

### 5. Test Reconnection

1. Stop the backend server
2. Frontend should show reconnection attempts in console
3. Start the backend server again
4. Frontend should automatically reconnect

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.omnicassion.com/api
NEXT_PUBLIC_WS_URL=https://api.omnicassion.com
NEXT_PUBLIC_SOCKET_PATH=/api/socket.io

# Backend
CORS_ORIGINS=https://omnicassion.com,https://www.omnicassion.com
NODE_ENV=production
```

**IMPORTANT**: Use `https://`, NOT `wss://` for production WS_URL! Socket.IO handles the WebSocket upgrade.

### Nginx Configuration (if using reverse proxy)

Add WebSocket support to your Nginx config:

```nginx
location /api/socket.io/ {
    proxy_pass http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Load Balancer

If using a load balancer, ensure:
- WebSocket support is enabled
- Sticky sessions are enabled (for Socket.IO polling fallback)
- Health checks don't interfere with WebSocket connections

## Troubleshooting

### Connection Still Fails

1. **Check environment variables are loaded**:
   ```bash
   # In frontend directory
   npm run dev
   # Should restart and load new .env.local
   ```

2. **Verify backend is accessible**:
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Check firewall/antivirus**: May block WebSocket connections

4. **Browser extensions**: Some ad blockers block WebSocket connections

### Authentication Errors

1. **Token expired**: Log out and log back in
2. **Invalid token**: Check that access token is being passed correctly
3. **Backend validation**: Check backend logs for authentication errors

### Still Having Issues?

1. Check browser console for detailed error messages
2. Check backend logs for connection attempts
3. Use browser DevTools Network tab (WS filter) to inspect WebSocket frames
4. Enable verbose logging in development:
   ```typescript
   // Should already be enabled in updated code
   console.log('[Notifications] Connection details:', { url, path, error })
   ```

## Files Changed

### Frontend
- ✅ `frontend/.env.local` - Added missing NEXT_PUBLIC_SOCKET_PATH, fixed protocol (ws→http)
- ✅ `frontend/src/lib/websocket/config.ts` - **CRITICAL FIX**: Removed http→ws protocol conversion
- ✅ `frontend/src/hooks/use-notifications.ts` - Enhanced error handling
- ✅ `frontend/src/lib/websocket/socket-client.ts` - Updated to use config utility
- ✅ `frontend/WEBSOCKET.md` - New comprehensive documentation with correct protocol usage

### Backend
- ✅ `backend/src/main.ts` - Improved CORS for development, added WebSocket adapter initialization

## Benefits

1. **More Reliable**: Automatic reconnection and fallback mechanisms
2. **Better DX**: Clear error messages and logging for debugging
3. **Production Ready**: Proper handling of both development and production environments
4. **Maintainable**: Centralized configuration reduces duplication
5. **Documented**: Comprehensive guide for future reference and onboarding

## Next Steps (Optional Enhancements)

Consider these future improvements:

1. **Connection Status UI**: Add a component to show WebSocket connection status
2. **Metrics**: Track connection success/failure rates
3. **Retry Strategy**: Implement exponential backoff with jitter
4. **Health Checks**: Periodic ping/pong to detect stale connections
5. **Message Queue**: Buffer messages when disconnected and send on reconnect
