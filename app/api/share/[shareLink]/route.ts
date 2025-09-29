import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ shareLink: string }> }) {
  try {
    const { shareLink } = await params
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    // Extract project ID from share link (format: share-{projectId}-{timestamp})
    const projectIdMatch = shareLink.match(/^share-(.+)-(\d+)$/)
    if (projectIdMatch) {
      const projectId = projectIdMatch[1]
      
      // Find project by ID
      const project = await db.project.select().from(table).where(eq(table.id, id))

      if (project) {
        // Return project data for share link access
        return NextResponse.json({
          status: 'success',
          message: 'Project accessed via share link',
          data: {
            project: {
              id: project.id,
              title: project.title,
              description: project.description,
              status: project.status,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              client: project.client,
              user: project.user,
              files: project.files,
              approvals: project.approvals,
              annotations: project.annotations
            }
          }
        })
      }
    }

    // If no project found, try to find review by shareLink (fallback)
    const review = await db.review.select().from(table).where(eq(table.id, id))

    let project

    // If no review found by shareLink, try to find by project ID
    if (!review) {
      project = await db.project.select().from(table).where(eq(table.id, id))

      if (!project) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Project not found' 
        }, { status: 404 })
      }
    } else {
      project = review.project
    }

    // If clientId is provided, verify client access
    if (clientId && project.clientId !== clientId) {
      return NextResponse.json({
        status: 'error',
        message: 'Access denied'
      }, { status: 403 })
    }

    // Get project files
    const projectDir = join(process.cwd(), 'public', 'uploads', 'projects', project.id)
    let files = []
    
    try {
      const fileList = await readdir(projectDir)
      
      for (const file of fileList) {
        const filePath = join(projectDir, file)
        const stats = await stat(filePath)
        
        // Skip directories and hidden files
        if (stats.isDirectory() || file.startsWith('.')) continue
        
        files.push({
          id: file.split('.')[0],
          name: file,
          url: `/uploads/projects/${project.id}/${file}`,
          type: getMimeType(file),
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          version: 'V1'
        })
      }
    } catch (dirError) {
      // Directory doesn't exist yet, files will be empty array
      console.log('Project directory not found:', dirError)
    }

    // Transform project data for client view
    const clientProjectData = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status.toLowerCase(),
      downloadEnabled: project.downloadEnabled,
      emailNotifications: project.emailNotifications,
      createdAt: project.createdAt,
      lastActivity: project.lastActivity,
      client: {
        id: project.client.id,
        name: project.client.name,
        company: project.client.company
      },
      files: files,
      publicLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/client/${project.clientId}?project=${project.id}`
    }

    return NextResponse.json({
      status: 'success',
      message: 'Project retrieved successfully',
      data: clientProjectData
    })
  } catch (error) {
    console.error('Get project by share link error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
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
