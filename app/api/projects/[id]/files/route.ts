import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

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
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create upload directory in public folder with version subdirectory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'versions', version)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${randomUUID()}.${fileExtension}`
    const filePath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update project's lastActivity
    await db.update(projects)
      .set({ lastActivity: new Date() })
      .where(eq(projects.id, projectId))

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        id: randomUUID(),
        name: file.name,
        url: `/uploads/projects/${projectId}/versions/${version}/${filename}`,
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
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Read files from all version directories
    const projectDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    const fileList = []
    
    try {
      // Check if versions directory exists
      const versionsDir = join(projectDir, 'versions')
      try {
        const versionDirs = await readdir(versionsDir)
        
        for (const versionDir of versionDirs) {
          const versionPath = join(versionsDir, versionDir)
          const versionStats = await stat(versionPath)
          
          // Skip if not a directory
          if (!versionStats.isDirectory()) continue
          
          // Read files in this version directory
          const files = await readdir(versionPath)
          
          for (const file of files) {
            const filePath = join(versionPath, file)
            const stats = await stat(filePath)
            
            // Skip directories and hidden files
            if (stats.isDirectory() || file.startsWith('.')) continue
            
            fileList.push({
              id: `${versionDir}-${file.split('.')[0]}`, // Use version and filename as ID
              name: file,
              url: `/uploads/projects/${projectId}/versions/${versionDir}/${file}`,
              type: getMimeType(file),
              size: stats.size,
              uploadedAt: stats.mtime.toISOString(),
              version: versionDir
            })
          }
        }
      } catch (versionsError) {
        // Versions directory doesn't exist, check root project directory
        const files = await readdir(projectDir)
        
        for (const file of files) {
          const filePath = join(projectDir, file)
          const stats = await stat(filePath)
          
          // Skip directories and hidden files
          if (stats.isDirectory() || file.startsWith('.')) continue
          
          fileList.push({
            id: `V1-${file.split('.')[0]}`, // Use V1 as default version
            name: file,
            url: `/uploads/projects/${projectId}/${file}`,
            type: getMimeType(file),
            size: stats.size,
            uploadedAt: stats.mtime.toISOString(),
            version: 'V1'
          })
        }
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
    const version = searchParams.get('version') || 'V1'

    if (!fileName) {
      return NextResponse.json({
        status: 'error',
        message: 'File name is required'
      }, { status: 400 })
    }

    // Verify project exists
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Try to delete from version directory first, then fallback to root
    let filePath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'versions', version, fileName)

    try {
      // Delete file from filesystem
      await unlink(filePath)
    } catch (fileError) {
      // Try deleting from root directory for backward compatibility
      const rootFilePath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, fileName)
      try {
        await unlink(rootFilePath)
      } catch (rootError) {
        console.error('File deletion error:', rootError)
        return NextResponse.json({
          status: 'error',
          message: 'File not found'
        }, { status: 404 })
      }
    }

    // Update project's lastActivity
    await db.update(projects)
      .set({ lastActivity: new Date() })
      .where(eq(projects.id, projectId))

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
