import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Mock replies storage (in production, this would be in database)
const mockReplies: any[] = []

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const annotationId = parseInt(params.id)
    const data = await request.json()
    
    const reply = {
      id: mockReplies.length + 1,
      annotation_id: annotationId,
      author: data.author,
      content: data.content,
      created_at: new Date(),
    }
    
    mockReplies.push(reply)
    
    console.log("[Static Mode] Reply created:", reply)
    
    // In production, you would emit a socket event here:
    // io.to(`annotation_${annotationId}`).emit('reply_added', reply)
    
    return NextResponse.json(reply)
  } catch (error) {
    console.error("Error creating reply:", error)
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const annotationId = parseInt(params.id)
    const replies = mockReplies.filter((r) => r.annotation_id === annotationId)
    
    return NextResponse.json(replies)
  } catch (error) {
    console.error("Error fetching replies:", error)
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 })
  }
}

