import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getProjectById, createDesignItem, getDesignItemsByReviewId, deleteDesignItem, getReviewsByProjectId, createReview } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST - Upload file to project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        status: 'error',
        message: 'File is required'
      }, { status: 400 })
    }

    // Verify project exists
    const project = await getProjectById(projectId)

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Create upload directory in public folder
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId.toString())
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${randomUUID()}.${fileExtension}`
    const filePath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create a review if none exists
    let reviewId = null
    const reviews = await getReviewsByProjectId(projectId)
    if (reviews.length === 0) {
      // Create a default review for the project
      const review = await createReview({
        projectId: projectId,
        shareLink: generateShareLink(),
        status: 'PENDING'
      })
      reviewId = review.id
    } else {
      reviewId = reviews[0].id
    }

    // Save file info to database
    const designItem = await createDesignItem({
      reviewId: reviewId,
      fileName: file.name,
      fileUrl: `/uploads/projects/${projectId}/${filename}`,
      fileType: file.type,
      fileSize: file.size
    })

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        id: designItem.id,
        name: file.name,
        url: `/uploads/projects/${projectId}/${filename}`,
        type: file.type,
        size: file.size,
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
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)

    // Verify project exists
    const project = await getProjectById(projectId)

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Get all design items for this project through reviews
    const reviews = await getReviewsByProjectId(projectId)
    const allDesignItems = []
    
    for (const review of reviews) {
      const items = await getDesignItemsByReviewId(review.id)
      allDesignItems.push(...items)
    }

    return NextResponse.json({
      status: 'success',
      data: {
        files: allDesignItems.map(item => ({
          id: item.id,
          name: item.fileName,
          url: item.fileUrl,
          type: item.fileType,
          size: item.fileSize,
          uploadedAt: item.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch files'
    }, { status: 500 })
  }
}

// DELETE - Delete file from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({
        status: 'error',
        message: 'File ID is required'
      }, { status: 400 })
    }

    // Verify project exists
    const project = await getProjectById(projectId)

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Get the design item to find the file path
    const reviews = await getReviewsByProjectId(projectId)
    let designItem = null
    
    for (const review of reviews) {
      const items = await getDesignItemsByReviewId(review.id)
      const item = items.find(item => item.id === parseInt(fileId))
      if (item) {
        designItem = item
        break
      }
    }

    if (!designItem) {
      return NextResponse.json({
        status: 'error',
        message: 'File not found'
      }, { status: 404 })
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'public', designItem.fileUrl)
    try {
      await unlink(filePath)
    } catch (fileError) {
      console.warn('File not found on filesystem:', fileError)
      // Continue with database deletion even if file doesn't exist
    }

    // Delete from database
    await deleteDesignItem(parseInt(fileId))

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

// Helper function to generate share link
function generateShareLink(): string {
  return randomUUID().replace(/-/g, '').substring(0, 12)
}
