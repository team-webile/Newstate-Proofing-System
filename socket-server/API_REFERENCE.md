# Socket Server API Reference

## Base URL
```
http://localhost:3003
```

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the socket server is running properly.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 12345.67,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

---

### 2. Emit Socket Event
**POST** `/api/emit`

Trigger a socket event emission to a specific room.

**Request Body:**
```json
{
  "event": "string",      // Event name to emit
  "room": "string",       // Room to emit to (e.g., "project-123")
  "data": object          // Event data payload
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Event \"annotationReplyAdded\" emitted to room \"project-123\"",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Missing required fields: event, room, data"
}
```

---

## Usage Examples

### From Next.js API Route

```typescript
// In your API route (e.g., app/api/annotations/reply/route.ts)
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003';

await fetch(`${socketUrl}/api/emit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'annotationReplyAdded',
    room: `project-${projectId}`,
    data: {
      projectId: projectId,
      annotationId: annotationId,
      reply: {
        id: replyId,
        content: replyContent,
        addedBy: 'Admin',
        addedByName: 'Admin User',
        createdAt: new Date().toISOString()
      }
    }
  })
}).catch(err => console.log('Socket emit failed:', err));
```

### Using cURL

```bash
curl -X POST http://localhost:3003/api/emit \
  -H "Content-Type: application/json" \
  -d '{
    "event": "annotationReplyAdded",
    "room": "project-123",
    "data": {
      "projectId": "123",
      "annotationId": "456",
      "reply": {
        "id": "789",
        "content": "Great work!",
        "addedBy": "Admin",
        "addedByName": "Admin User",
        "createdAt": "2025-10-01T12:00:00.000Z"
      }
    }
  }'
```

---

## Supported Socket Events

### Client → Server Events (Listeners)

These are events that clients can emit to the server:

- `join-project` - Join a project room
- `leave-project` - Leave a project room
- `addAnnotation` - Add a new annotation
- `addAnnotationReply` - Add a reply to an annotation
- `annotationStatusChanged` - Change annotation status
- `projectStatusChanged` - Change project approval status
- `typing` - Send typing indicator

### Server → Client Events (Emissions)

These are events that the server broadcasts to clients:

- `annotationAdded` - New annotation was added
- `annotationReplyAdded` - New reply was added to annotation
- `annotationStatusUpdated` - Annotation status changed
- `projectStatusChanged` - Project approval status changed
- `reviewStatusChanged` - Review status changed
- `typing` - User is typing

---

## Room Naming Convention

All project-related events should use the room naming format:
```
project-{projectId}
```

Example:
- Project ID: `abc123`
- Room name: `project-abc123`

---

## Error Handling

### Missing Fields
```json
{
  "status": "error",
  "message": "Missing required fields: event, room, data"
}
```
**Status Code:** 400

### Server Error
```json
{
  "status": "error",
  "message": "Failed to emit socket event",
  "error": "Error message details"
}
```
**Status Code:** 500

---

## Security Considerations

⚠️ **Important:** This endpoint currently has no authentication. In production, you should:

1. Add API key authentication
2. Validate the source of requests
3. Rate limit the endpoint
4. Validate event data structure
5. Sanitize all user inputs

Example with API key:
```typescript
app.post('/api/emit', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.SOCKET_API_KEY) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }
  
  // ... rest of the code
});
```

---

## Monitoring

### Server Logs

The socket server logs all emissions:

```
📡 Emitting event "annotationReplyAdded" to room "project-123"
📦 Data: {
  "projectId": "123",
  "annotationId": "456",
  ...
}
```

### Connection Logs

```
🔌 Client connected: socket-id-here
🔗 Socket socket-id-here joined project room: project-123
Client disconnected: socket-id-here
```

---

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3003/health
```

### Test Emit Endpoint
```bash
curl -X POST http://localhost:3003/api/emit \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test",
    "room": "project-test",
    "data": { "message": "Hello from API!" }
  }'
```

---

## Troubleshooting

### Issue: Socket server not responding
**Solution:** Check if the server is running:
```bash
ps aux | grep node
```

### Issue: Events not received by clients
**Solution:** 
1. Verify clients have joined the correct room
2. Check room name format matches (`project-{id}`)
3. Check browser console for socket connection

### Issue: CORS errors
**Solution:** Add your domain to `allowedOrigins` in `new-server.js`:
```javascript
const allowedOrigins = [
  '*',
  'http://localhost:3000',
  'https://yourdomain.com'
];
```

---

**Server Version:** 1.0.0
**Last Updated:** 2025-10-01

