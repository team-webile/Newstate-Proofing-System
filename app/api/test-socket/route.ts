import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { projectId, message, userType } = await req.json();
    
    console.log('🧪 Test socket API called:', { projectId, message, userType });

    // Emit socket event for real-time updates
    try {
      const { getSocketServer } = await import('@/lib/socket-server');
      const io = getSocketServer();
      
      if (io) {
        console.log('📡 Emitting test socket event for project:', projectId);
        
        // Send dummy success message
        io.to(`project-${projectId}`).emit('dummySuccessMessage', {
          type: 'test_message',
          message: `🧪 Test: ${message}`,
          from: userType === 'admin' ? 'Admin' : 'Client',
          to: userType === 'admin' ? 'Client' : 'Admin',
          projectId: projectId,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Test socket event emitted successfully');
      } else {
        console.log('⚠️ Socket server not available');
      }
    } catch (error) {
      console.log("Socket emission error:", error);
    }

    return NextResponse.json({
      status: "success",
      message: `Test message sent: ${message}`,
      data: { projectId, message, userType }
    });
  } catch (error) {
    console.error("Test socket error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to send test message",
      },
      { status: 500 }
    );
  }
}
