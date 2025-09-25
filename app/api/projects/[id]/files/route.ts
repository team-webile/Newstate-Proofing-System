import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'

// POST - Upload file to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File
    const version = formData.get('version') as string || 'V1'

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

    // Create upload directory in public folder
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update project's lastActivity
    await prisma.project.update({
      where: { id: projectId },
      data: { lastActivity: new Date() }
    })

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        id: uuidv4(),
        name: file.name,
        url: `/uploads/projects/${projectId}/${filename}`,
        type: file.type,
        size: file.size,
        version: version,
        uploadedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to upload file'
    }, { status: 500 })
  }
}

// GET - Get project files
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

    // Read files from the project directory
    const projectDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    
    try {
      const files = await readdir(projectDir)
      const fileList = []
      
      for (const file of files) {
        const filePath = join(projectDir, file)
        const stats = await stat(filePath)
        
        // Skip directories and hidden files
        if (stats.isDirectory() || file.startsWith('.')) continue
        
        fileList.push({
          id: file.split('.')[0], // Use filename without extension as ID
          name: file,
          url: `/uploads/projects/${projectId}/${file}`,
          type: getMimeType(file),
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          version: 'V1' // Default version
        })
      }
      
      return NextResponse.json({
        status: 'success',
        data: {
          files: fileList
        }
      })
    } catch (dirError) {
      // Directory doesn't exist yet, return empty array
      return NextResponse.json({
        status: 'success',
        data: {
          files: []
        }
      })
    }
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch files'
    }, { status: 500 })
  }
}

// Helper function to get MIME type based on file extension
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'pdf':
      return 'application/pdf'
    case 'psd':
      return 'image/vnd.adobe.photoshop'
    case 'ai':
      return 'application/postscript'
    case 'eps':
      return 'application/postscript'
    default:
      return 'application/octet-stream'
  }
}

// DELETE - Delete file from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({
        status: 'error',
        message: 'File name is required'
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

    // Construct file path
    const filePath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, fileName)

    try {
      // Delete file from filesystem
      await unlink(filePath)
    } catch (fileError) {
      console.error('File deletion error:', fileError)
      // Continue even if file doesn't exist on filesystem
    }

    // Update project's lastActivity
    await prisma.project.update({
      where: { id: projectId },
      data: { lastActivity: new Date() }
    })

    return NextResponse.json({
      status: 'success',
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to delete file'
    }, { status: 500 })
  }
}
