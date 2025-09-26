# Socket.io Client Connection Troubleshooting

## 🔧 **Issue: Client-side socket is not working**

### ✅ **Solutions Implemented**

1. **Enhanced Socket Manager**

   - Added missing `addAnnotationReply` method
   - Added `updateReviewStatus` method
   - Added proper event listeners for replies and status updates
   - Added `forceNew: true` to prevent connection reuse issues

2. **Updated Real-time Hook**

   - Integrated new socket methods
   - Added proper event listeners
   - Enhanced error handling

3. **Socket Test Component**
   - Created `SocketTest.tsx` for debugging
   - Real-time connection status monitoring
   - Event testing functionality

## 🚀 **How to Test Socket Connection**

### 1. **Navigate to Test Page**

```
http://localhost:3000/test-annotations
```

### 2. **Check Socket Test Component**

- Look for "Connected" badge (green = connected, red = disconnected)
- Socket ID should be displayed
- Test buttons should be enabled when connected

### 3. **Test Socket Events**

- Click "Test Annotation" - should emit annotation event
- Click "Test Reply" - should emit reply event
- Click "Test Status Update" - should emit status event

## 🔍 **Debug Steps**

### 1. **Check Browser Console**

```javascript
// Look for these messages:
"Socket connected: [socket-id]";
"Socket disconnected: [reason]";
"📝 Server received addAnnotation event: [data]";
```

### 2. **Check Server Console**

```bash
# Should see:
"🔌 Client connected: [socket-id]"
"🔗 Socket [socket-id] joined project [project-id]"
"📝 Server received addAnnotation event: [data]"
```

### 3. **Verify Socket.io Server**

```bash
# Check if server is running on port 3000
curl http://localhost:3000/api/socketio
```

## 🛠️ **Common Issues & Fixes**

### Issue 1: "Socket not connecting"

**Solution:**

```typescript
// Check environment variables
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Issue 2: "Events not emitting"

**Solution:**

```typescript
// Ensure socket is connected before emitting
if (this.socket?.connected) {
  this.socket.emit("addAnnotation", data);
}
```

### Issue 3: "Server not receiving events"

**Solution:**

```javascript
// Check server.js is running
node server.js
// Should see: "🚀 Server ready on http://localhost:3000"
```

### Issue 4: "CORS errors"

**Solution:**

```javascript
// Update server.js CORS configuration
cors: {
  origin: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
}
```

## 📋 **Complete Socket Flow**

### 1. **Client Connection**

```typescript
const socket = io("http://localhost:3000", {
  path: "/api/socketio",
  transports: ["websocket", "polling"],
  forceNew: true,
});
```

### 2. **Join Project Room**

```typescript
socket.emit("join-project", projectId);
```

### 3. **Emit Events**

```typescript
// Add annotation
socket.emit("addAnnotation", {
  projectId,
  fileId,
  annotation,
  coordinates: { x, y },
  addedBy,
  addedByName,
});

// Add reply
socket.emit("addAnnotationReply", {
  projectId,
  annotationId,
  reply,
  addedBy,
  addedByName,
});
```

### 4. **Listen for Events**

```typescript
socket.on("annotationAdded", (data) => {
  // Handle new annotation
});

socket.on("annotationReplyAdded", (data) => {
  // Handle new reply
});
```

## 🧪 **Testing Checklist**

- [ ] Server is running (`npm run dev`)
- [ ] Socket.io server is active (check console logs)
- [ ] Client connects successfully (green badge)
- [ ] Socket ID is displayed
- [ ] Test events are working
- [ ] Real-time updates are received
- [ ] No CORS errors in browser console
- [ ] No connection errors in server console

## 🔧 **Advanced Debugging**

### Enable Socket.io Debug Logs

```javascript
// Add to browser console
localStorage.setItem("debug", "socket.io-client:*");
```

### Check Socket Connection State

```typescript
console.log("Socket connected:", socket.connected);
console.log("Socket ID:", socket.id);
console.log("Socket transport:", socket.io.engine.transport.name);
```

### Monitor Network Tab

- Look for WebSocket connections to `/api/socketio`
- Check for failed requests or CORS errors
- Verify polling requests are working

## 📞 **If Still Not Working**

1. **Restart Development Server**

   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Browser Cache**

   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Try incognito mode

3. **Check Port Conflicts**

   ```bash
   # Check if port 3000 is available
   netstat -an | findstr :3000
   ```

4. **Verify Dependencies**
   ```bash
   npm install socket.io-client
   npm install socket.io
   ```

## ✅ **Expected Behavior**

When working correctly, you should see:

1. **Client Side:**

   - Green "Connected" badge
   - Socket ID displayed
   - Test buttons enabled
   - Events logged in console

2. **Server Side:**

   - "🔌 Client connected" message
   - "🔗 Socket joined project" message
   - Event handling logs

3. **Real-time Updates:**
   - Annotations appear instantly
   - Replies update in real-time
   - Status changes broadcast immediately

The socket connection should now work properly with complete real-time functionality for annotations and replies!
