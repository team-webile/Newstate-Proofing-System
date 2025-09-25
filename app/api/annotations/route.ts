import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Add new annotation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      content, 
      fileId, 
      projectId, 
      coordinates, 
      addedBy, 
      addedByName 
    } = body

    // Validate required fields
    if (!content || !fileId || !projectId || !addedBy) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create annotation
    const annotation = await prisma.annotation.create({
      data: {
        content,
        fileId,
        projectId,
        coordinates,
        addedBy,
        addedByName
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Annotation added successfully',
      data: {
        id: annotation.id,
        content: annotation.content,
        fileId: annotation.fileId,
        projectId: annotation.projectId,
        coordinates: annotation.coordinates,
        addedBy: annotation.addedBy,
        addedByName: annotation.addedByName,
        createdAt: annotation.createdAt
      }
    })

  } catch (error) {
    console.error('Annotation creation error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to add annotation'
    }, { status: 500 })
  }
}

// GET - Get annotations for project/file
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const fileId = searchParams.get('fileId')

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Project ID is required'
      }, { status: 400 })
    }

    // Build where clause
    const where: any = {
      projectId: projectId
    }

    if (fileId) {
      where.fileId = fileId
    }

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Annotations retrieved successfully',
      data: annotations.map(annotation => ({
        id: annotation.id,
        content: annotation.content,
        fileId: annotation.fileId,
        projectId: annotation.projectId,
        coordinates: annotation.coordinates,
        addedBy: annotation.addedBy,
        addedByName: annotation.addedByName,
        createdAt: annotation.createdAt
      }))
    })

  } catch (error) {
    console.error('Annotation fetch error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch annotations'
    }, { status: 500 })
  }
}