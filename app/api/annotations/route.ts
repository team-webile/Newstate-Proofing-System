import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Fetch annotations for a specific file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const designItemId = searchParams.get('designItemId')

    if (!designItemId) {
      return NextResponse.json({ error: "Design item ID is required" }, { status: 400 })
    }

    const annotations = await prisma.annotation.findMany({
      where: { designItemId: parseInt(designItemId) },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(annotations)
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return NextResponse.json({ error: "Failed to fetch annotations" }, { status: 500 })
  }
}

// POST - Create a new annotation
export async function POST(request: NextRequest) {
  try {
    const { designItemId, xPosition, yPosition, content } = await request.json()

    if (!designItemId || xPosition === undefined || yPosition === undefined || !content) {
      return NextResponse.json({ error: "Design item ID, position, and content are required" }, { status: 400 })
    }

    const annotation = await prisma.annotation.create({
      data: {
        designItemId: parseInt(designItemId),
        xPosition: parseFloat(xPosition),
        yPosition: parseFloat(yPosition),
        content
      }
    })

    return NextResponse.json(annotation)
  } catch (error) {
    console.error('Error creating annotation:', error)
    return NextResponse.json({ error: "Failed to create annotation" }, { status: 500 })
  }
}