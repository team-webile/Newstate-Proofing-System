# Review Status & Annotation Control System

## Overview

The NewState Proofing System now includes comprehensive review status management that automatically disables annotations when reviews are approved or rejected. This ensures that feedback is only collected during active review periods.

## 🚀 **Key Features**

### ✅ **Review Status Control**

- **PENDING**: Annotations and replies are enabled
- **APPROVED**: Annotations and replies are disabled
- **REJECTED**: Annotations and replies are disabled

### ✅ **Real-time Status Updates**

- Live status updates via Socket.io
- Automatic annotation disabling when status changes
- Visual indicators for disabled state

### ✅ **Complete Socket Integration**

- Real-time annotation replies
- Live status change notifications
- Instant updates across all connected users

## 🗄️ **Database Schema**

The system uses the existing `Review` model with status field:

```sql
model Review {
  id        String       @id @default(cuid())
  status    ReviewStatus @default(PENDING)
  projectId String
  -- other fields
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## 🔌 **API Endpoints**

### 1. Update Review Status

```typescript
PUT /api/reviews/{id}/status
{
  "status": "APPROVED" | "REJECTED" | "PENDING"
}
```

### 2. Annotation API (with status check)

```typescript
POST / api / annotations;
// Automatically checks review status before allowing annotation creation
```

### 3. Annotation Reply API (with status check)

```typescript
POST / api / annotations / reply;
// Automatically checks review status before allowing reply creation
```

## 🎯 **Component Usage**

### Enhanced ImageAnnotation Component

```tsx
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
  annotationsDisabled={false}
  reviewStatus="PENDING"
/>
```

### Real-time Hook with Status

```tsx
const {
  annotations,
  reviewStatus,
  annotationsDisabled,
  addAnnotation,
  addAnnotationReply,
  resolveAnnotation,
  isConnected,
} = useRealtimeComments({
  projectId: "project-123",
  fileId: "file-456",
  currentUser: { name: "User", role: "Client" },
});
```

## 🔄 **Socket.io Events**

### Client Events (Emit)

- `addAnnotation` - Add new annotation
- `addAnnotationReply` - Add reply to annotation
- `resolveAnnotation` - Mark annotation as resolved
- `reviewStatusChanged` - Update review status

### Server Events (Listen)

- `annotationAdded` - New annotation added
- `annotationReplyAdded` - New reply added
- `annotationResolved` - Annotation resolved
- `reviewStatusUpdated` - Review status changed

## 🎨 **User Interface Features**

### 1. **Status Indicators**

- Clear visual feedback when annotations are disabled
- Color-coded status badges (PENDING/APPROVED/REJECTED)
- Warning messages for disabled state

### 2. **Disabled State UI**

- Disabled buttons for adding annotations
- Disabled reply functionality
- Clear messaging about why features are disabled

### 3. **Real-time Updates**

- Live status changes across all users
- Instant annotation disabling
- Connection status indicators

## 🧪 **Testing**

### Test Page: `/test-annotations`

The test page includes:

- **User Role Toggle**: Switch between Admin and Client
- **Review Status Controls**: Change status between PENDING/APPROVED/REJECTED
- **Real-time Annotation System**: Full functionality testing
- **Status Indicators**: Visual feedback for all states

### How to Test:

1. Navigate to `/test-annotations`
2. Switch between user roles
3. Change review status to APPROVED or REJECTED
4. Observe annotations become disabled
5. Change back to PENDING to re-enable

## 🔧 **Implementation Details**

### 1. **Status Checking**

```typescript
// API automatically checks review status
if (project.reviews.length > 0) {
  const latestReview = project.reviews[0];
  if (
    latestReview.status === "APPROVED" ||
    latestReview.status === "REJECTED"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: `Annotations are disabled. Review status is ${latestReview.status}`,
      },
      { status: 403 }
    );
  }
}
```

### 2. **Real-time Status Updates**

```typescript
// Socket listener for status changes
socket.on("reviewStatusUpdated", (data) => {
  setReviewStatus(data.status);
  setAnnotationsDisabled(
    data.status === "APPROVED" || data.status === "REJECTED"
  );
});
```

### 3. **Component State Management**

```typescript
const [reviewStatus, setReviewStatus] = useState<string>("PENDING");
const [annotationsDisabled, setAnnotationsDisabled] = useState(false);
```

## 🚦 **Status Flow**

```
PENDING → APPROVED/REJECTED
   ↓              ↓
Annotations    Annotations
Enabled        Disabled
   ↓              ↓
Real-time      Real-time
Updates        Status
Continue       Broadcast
```

## 🔒 **Security Features**

### 1. **API Protection**

- All annotation endpoints check review status
- Automatic blocking when status is APPROVED/REJECTED
- Proper error messages for disabled state

### 2. **Real-time Security**

- Socket events respect review status
- Status changes broadcast to all users
- Consistent state across all clients

## 📱 **Mobile Support**

- Responsive design for all screen sizes
- Touch-friendly annotation controls
- Mobile-optimized status indicators

## 🎯 **Best Practices**

### 1. **Status Management**

- Always check review status before allowing annotations
- Provide clear feedback to users about disabled state
- Use consistent status indicators across the app

### 2. **Real-time Updates**

- Handle connection drops gracefully
- Show offline indicators when disconnected
- Implement reconnection logic

### 3. **User Experience**

- Clear visual feedback for all states
- Consistent color coding (PENDING=Blue, APPROVED=Green, REJECTED=Red)
- Helpful error messages

## 🔮 **Future Enhancements**

- [ ] Email notifications for status changes
- [ ] Bulk status updates for multiple reviews
- [ ] Status change audit trail
- [ ] Custom status workflows
- [ ] Advanced permission controls

## 🆘 **Troubleshooting**

### Common Issues

1. **Annotations not disabling**

   - Check Socket.io connection
   - Verify review status API calls
   - Check browser console for errors

2. **Real-time updates not working**

   - Verify Socket.io server is running
   - Check event names match
   - Test with multiple browser tabs

3. **Status not updating**
   - Check API endpoint accessibility
   - Verify database connection
   - Check review ID validity

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem("debug", "socket.io-client:*");
```

## 📞 **Support**

For technical support or feature requests, please refer to the project documentation or contact the development team.
