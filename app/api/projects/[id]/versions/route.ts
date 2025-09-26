import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST - Create new version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File
    const versionName = formData.get('versionName') as string || 'New Version'
    const description = formData.get('description') as string || ''

    if (!file) {
      return NextResponse.json({
        status: 'error',
        message: 'File is required'
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

    // Create version directory
    const versionId = uuidv4()
    const versionDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'versions', versionId)
    await mkdir(versionDir, { recursive: true })

    // Save file
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${Date.now()}-${file.name}`
    const filePath = join(versionDir, fileName)
    await writeFile(filePath, Buffer.from(fileBuffer))

    // Since we don't have a ProjectFile model, we'll create a mock file object
    // and return a mock version response
    const newFile = {
      id: versionId,
      name: file.name,
      url: `/uploads/projects/${projectId}/versions/${versionId}/${fileName}`,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    }

    // Return mock version data
    const version = {
      id: versionId,
      version: 'V1',
      name: versionName,
      description,
      files: [newFile],
      status: 'pending_review',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return NextResponse.json({
      status: 'success',
      message: 'Version created successfully',
      data: version
    })

  } catch (error) {
    console.error('Create version error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create version'
    }, { status: 500 })
  } finally {
    // No need to disconnect when using shared client
  }
}

// GET - Get all versions for project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Since we don't have a ProjectVersion model, we'll return mock versions
    // based on the current project structure
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        annotations: true,
        approvals: true
      }
    })

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create mock versions based on project structure
    const versions = [
      {
        id: 'v1',
        version: 'V1',
        name: 'Initial Version',
        description: 'First version of the project',
        files: [], // No files in current schema
        status: 'pending_review',
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    ]

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
