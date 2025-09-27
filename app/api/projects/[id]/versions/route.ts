import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Create new version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await req.json()
    const { version, description } = body

    if (!version) {
      return NextResponse.json({
        status: 'error',
        message: 'Version name is required'
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

    // Check if version already exists
    const existingVersion = await prisma.version.findFirst({
      where: {
        projectId: projectId,
        version: version
      }
    })

    if (existingVersion) {
      return NextResponse.json({
        status: 'error',
        message: 'Version already exists'
      }, { status: 400 })
    }

    // Create new version in database
    const newVersion = await prisma.version.create({
      data: {
        version,
        description: description || '',
        projectId,
        status: 'DRAFT'
      }
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Version created successfully',
      data: newVersion
    })

  } catch (error) {
    console.error('Create version error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create version'
    }, { status: 500 })
  }
}

// GET - Get all versions for project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

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

    // Fetch versions from database
    const versions = await prisma.version.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })

    // If no versions exist, create a default V1 version
    if (versions.length === 0) {
      const defaultVersion = await prisma.version.create({
        data: {
          version: 'V1',
          description: 'Initial Version',
          projectId,
          status: 'DRAFT'
        }
      })
      versions.push(defaultVersion)
    }

    return NextResponse.json({
      status: 'success',
      data: versions
    })

  } catch (error) {
    console.error('Get versions error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch versions'
    }, { status: 500 })
  }
}