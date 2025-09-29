# Socket.IO Setup Guide

## ✅ Socket Server Configuration Complete!

Your Socket.IO server is now configured to run on port 3000 together with your Next.js application.

### What's Been Set Up:

1. **Custom Server (`server.js`)**
   - Runs both Next.js and Socket.IO on the same port (3000)
   - Handles all Socket.IO events (annotations, comments, replies, etc.)
   - Proper CORS configuration for development and production

2. **Updated Package.json Scripts**
   - `npm run dev` - Runs the custom server with Socket.IO
   - `npm run start` - Runs production server with Socket.IO
   - `npm run test:socket` - Tests Socket.IO connection

3. **Socket Client Configuration**
   - Updated to connect to the same port (3000)
   - Removed unnecessary path configuration
   - Proper reconnection handling

4. **Test Page**
   - Visit `/test-socket` to test Socket.IO functionality
   - Real-time connection status
   - Send test messages and see responses

### How to Run:

1. **Development Mode:**
   ```bash
   npm run dev
   ```
   - Next.js app runs on http://localhost:3000
   - Socket.IO server runs on the same port
   - Both share the same HTTP server

2. **Production Mode:**
   ```bash
   npm run build
   npm run start
   ```

3. **Test Socket Connection:**
   ```bash
   npm run test:socket
   ```

### Environment Variables:

Make sure your `.env.local` file includes:
```env
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Socket Events Supported:

- **Annotations:** `addAnnotation`, `resolveAnnotation`, `annotationStatusChanged`
- **Comments:** `addComment`, `commentAdded`
- **Replies:** `addAnnotationReply`, `annotationReplyAdded`
- **Status Updates:** `updateElementStatus`, `statusChanged`
- **Project Rooms:** `join-project`, `leave-project`
- **Typing Indicators:** `typing`

### Testing:

1. **Browser Test:**
   - Go to http://localhost:3000/test-socket
   - Check connection status
   - Send test messages

2. **Script Test:**
   ```bash
   npm run test:socket
   ```

3. **Multiple Browser Test:**
   - Open multiple browser tabs
   - Send messages from one tab
   - See real-time updates in other tabs

### Key Benefits:

✅ **Single Port:** Everything runs on port 3000  
✅ **Real-time Communication:** Instant updates across clients  
✅ **Project Rooms:** Isolated communication per project  
✅ **Auto-reconnection:** Handles connection drops gracefully  
✅ **Production Ready:** Works in both dev and production  

### Troubleshooting:

1. **Connection Issues:**
   - Check if port 3000 is available
   - Verify environment variables
   - Check browser console for errors

2. **Socket Not Connecting:**
   - Ensure server is running (`npm run dev`)
   - Check CORS settings
   - Verify Socket.IO client configuration

3. **Events Not Working:**
   - Check if client is in the correct project room
   - Verify event names match between client and server
   - Check server console for errors

Your Socket.IO server is now fully integrated and ready to use! 🎉
