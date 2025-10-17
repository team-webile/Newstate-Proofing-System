import { NextRequest, NextResponse } from 'next/server'
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

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${randomUUID()}.${fileExtension}`
    const bunnyFilePath = `projects/${projectId}/${filename}`

    // Upload to Bunny CDN
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${bunnyFilePath}`

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.BUNNY_ACCESS_KEY || '',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Bunny CDN upload failed: ${errorText}`)
    }

    // CDN URL for the uploaded file
    const cdnUrl = `https://${process.env.BUNNY_CDN_HOSTNAME}/${bunnyFilePath}`

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
      fileUrl: cdnUrl,
      fileType: file.type,
      fileSize: file.size
    })

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        id: designItem.id,
        name: file.name,
        url: cdnUrl,
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

    // Delete file from Bunny CDN
    try {
      // Extract the file path from the CDN URL
      const cdnHostname = process.env.BUNNY_CDN_HOSTNAME || ''
      const filePath = designItem.fileUrl.replace(`https://${cdnHostname}/`, '')
      
      const deleteUrl = `https://${process.env.BUNNY_STORAGE_HOSTNAME}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${filePath}`

      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': process.env.BUNNY_ACCESS_KEY || '',
        },
      })

      if (!deleteResponse.ok) {
        console.warn('Failed to delete file from Bunny CDN:', await deleteResponse.text())
        // Continue with database deletion even if CDN deletion fails
      }
    } catch (fileError) {
      console.warn('Error deleting file from Bunny CDN:', fileError)
      // Continue with database deletion even if file deletion fails
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
