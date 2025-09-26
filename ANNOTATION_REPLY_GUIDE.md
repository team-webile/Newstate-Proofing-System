# Enhanced Annotation Reply System

## Overview

The NewState Proofing System now includes a comprehensive annotation reply system that allows both admins and clients to:

- Add annotations to images with precise coordinates
- Reply to existing annotations with threaded conversations
- Resolve annotations when issues are addressed
- View real-time updates across all connected users

## Features

### ✅ **Admin & Client Annotation Support**

- Both admins and clients can add annotations
- Both can reply to any annotation
- Real-time collaboration between all users

### ✅ **Threaded Conversations**

- Each annotation can have multiple replies
- Replies are displayed in chronological order
- Clear visual distinction between original annotation and replies

### ✅ **Real-time Updates**

- Live updates via Socket.io
- Instant notification of new annotations and replies
- Connection status indicators

### ✅ **Resolution System**

- Admins can mark annotations as resolved
- Visual indicators for resolved vs pending annotations
- Status tracking across the system

## Database Schema

### New Tables Added

```sql
-- Annotation Reply Table
CREATE TABLE annotation_replies (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  annotationId TEXT NOT NULL,
  addedBy TEXT NOT NULL,
  addedByName TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (annotationId) REFERENCES annotations(id) ON DELETE CASCADE
);

-- Enhanced Annotation Table
ALTER TABLE annotations ADD COLUMN isResolved BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### 1. Add Annotation Reply

```typescript
POST /api/annotations/reply
{
  "annotationId": "string",
  "content": "string",
  "addedBy": "Admin" | "Client",
  "addedByName": "string"
}
```

### 2. Resolve Annotation

```typescript
PUT / api / annotations / { id } / resolve;
```

### 3. Get Annotations with Replies

```typescript
GET /api/annotations?projectId={id}&fileId={id}
// Returns annotations with included replies
```

## Component Usage

### Basic ImageAnnotation Component

```tsx
import ImageAnnotation from "@/components/ImageAnnotation";

<ImageAnnotation
  imageUrl="/path/to/image.jpg"
  imageAlt="Design Review"
  fileId="file-123"
  projectId="project-456"
  annotations={annotations}
  onAnnotationAdd={handleAnnotationAdd}
  onAnnotationResolve={handleAnnotationResolve}
  onAnnotationReply={handleAnnotationReply}
  isAdmin={true}
  currentUser={{ name: "Admin User", role: "Admin" }}
/>;
```

### Enhanced Component with Real-time

```tsx
import EnhancedImageAnnotation from "@/components/EnhancedImageAnnotation";

<EnhancedImageAnnotation
  imageUrl="/path/to/image.jpg"
  imageAlt="Design Review"
  fileId="file-123"
  projectId="project-456"
  isAdmin={true}
  currentUser={{ name: "Admin User", role: "Admin" }}
/>;
```

## Real-time Hook Usage

```tsx
import { useRealtimeComments } from "@/hooks/use-realtime-comments";

const {
  annotations,
  addAnnotation,
  addAnnotationReply,
  resolveAnnotation,
  isConnected,
} = useRealtimeComments({
  projectId: "project-123",
  fileId: "file-456",
  currentUser: { name: "User", role: "Client" },
});

// Add annotation
await addAnnotation({
  x: 50,
  y: 30,
  comment: "This color needs to be changed",
  fileId: "file-456",
  addedBy: "Client",
  addedByName: "John Doe",
});

// Reply to annotation
await addAnnotationReply("annotation-123", "I'll fix that right away!");

// Resolve annotation
await resolveAnnotation("annotation-123");
```

## Socket.io Events

### Client Events (Emit)

- `addAnnotation` - Add new annotation
- `addAnnotationReply` - Add reply to annotation
- `resolveAnnotation` - Mark annotation as resolved

### Server Events (Listen)

- `annotationAdded` - New annotation added
- `annotationReplyAdded` - New reply added
- `annotationResolved` - Annotation resolved

## User Interface Features

### 1. **Annotation Pins**

- Red pins for unresolved annotations
- Green pins for resolved annotations
- Click to view details and replies

### 2. **Reply Dialog**

- Clean interface for adding replies
- Shows original annotation context
- Real-time character count and validation

### 3. **Status Indicators**

- Connection status (Connected/Disconnected)
- Annotation counts and summaries
- Visual feedback for all actions

### 4. **Admin Controls**

- Resolve annotation button (admin only)
- Bulk actions for multiple annotations
- Status filtering and sorting

## Implementation Steps

### 1. Database Migration

```bash
npx prisma db push
```

### 2. Update Components

Replace existing ImageAnnotation usage with EnhancedImageAnnotation for automatic real-time support.

### 3. Configure Socket.io

Ensure Socket.io server is running and properly configured for real-time events.

### 4. Test Functionality

- Add annotations as both admin and client
- Test reply functionality
- Verify real-time updates
- Test resolution workflow

## Best Practices

### 1. **User Experience**

- Always show connection status
- Provide clear visual feedback
- Use consistent color coding (red=pending, green=resolved)

### 2. **Performance**

- Limit annotation history for large projects
- Implement pagination for replies
- Use debouncing for real-time updates

### 3. **Security**

- Validate user permissions for admin actions
- Sanitize all user input
- Implement rate limiting for API calls

### 4. **Real-time Updates**

- Handle connection drops gracefully
- Show offline indicators
- Implement reconnection logic

## Troubleshooting

### Common Issues

1. **Annotations not appearing**

   - Check Socket.io connection
   - Verify projectId and fileId
   - Check browser console for errors

2. **Replies not saving**

   - Verify API endpoint is accessible
   - Check database connection
   - Validate required fields

3. **Real-time updates not working**
   - Check Socket.io server status
   - Verify event names match
   - Test with multiple browser tabs

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem("debug", "socket.io-client:*");
```

## Future Enhancements

- [ ] File attachments in replies
- [ ] @mentions in annotation replies
- [ ] Email notifications for new replies
- [ ] Bulk annotation operations
- [ ] Annotation templates
- [ ] Advanced filtering and search
- [ ] Mobile-optimized interface
- [ ] Voice annotations
- [ ] Screen recording annotations

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
