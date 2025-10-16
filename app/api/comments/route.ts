import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Fetch comments for a specific file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const designItemId = searchParams.get('designItemId')

    if (!designItemId) {
      return NextResponse.json({ error: "Design item ID is required" }, { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: { designItemId: parseInt(designItemId) },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const { 
      designItemId, 
      author, 
      content, 
      type, 
      drawingData, 
      canvasPosition,
      pdfPage 
    } = await request.json()

    if (!designItemId || !author || !content) {
      return NextResponse.json({ error: "Design item ID, author, and content are required" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        designItemId: parseInt(designItemId),
        author: author,
        content: content,
        type: type || 'comment',
        drawingData: drawingData || null,
        canvasX: canvasPosition?.x || null,
        canvasY: canvasPosition?.y || null,
        canvasWidth: canvasPosition?.width || null,
        canvasHeight: canvasPosition?.height || null,
        imageWidth: canvasPosition?.imageWidth || null,
        imageHeight: canvasPosition?.imageHeight || null,
        pdfPage: pdfPage || null
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
