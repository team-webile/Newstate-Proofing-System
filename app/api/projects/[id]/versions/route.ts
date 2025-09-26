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

    // Create version record in database
    const version = await prisma.projectVersion.create({
      data: {
        id: versionId,
        projectId,
        versionName,
        description,
        fileName: file.name,
        filePath: `/uploads/projects/${projectId}/versions/${versionId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        createdBy: 'Admin', // In real app, get from auth
        createdAt: new Date()
      }
    })

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

    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

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
  } finally {
    // No need to disconnect when using shared client
  }
}
