import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/elements called')
    
    const formData = await req.formData()
    const elementName = formData.get('elementName') as string
    const projectId = formData.get('projectId') as string
    const files = formData.getAll('files') as File[]

    console.log('Form data:', { elementName, projectId, filesCount: files.length })

    if (!elementName || !projectId || files.length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Get or create a default review for the project
    console.log('Looking for review for project:', projectId)
    let review = await ReviewModel.findByProjectIdFirst(projectId)
    if (!review) {
      console.log('No review found, creating default review')
      // Generate unique share link
      const shareLink = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      review = await ReviewModel.create({
        projectId,
        reviewName: 'Default Review',
        description: 'Default review for project elements',
        shareLink,
        updatedAt: new Date()
      })
      console.log('Created review:', review.id)
    } else {
      console.log('Found existing review:', review.id)
    }

    const uploadedFiles = []
    const versions = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const filename = `${elementName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${i}.${fileExtension}`
      const filePath = join(uploadsDir, filename)

      // Write file to disk
      await writeFile(filePath, buffer)

      // Store file info
      const fileInfo = {
        filename: file.name,
        filePath: filename, // Store relative path
        fileSize: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString()
      }

      uploadedFiles.push(fileInfo)
      versions.push({
        version: i + 1,
        ...fileInfo
      })
    }

    // Create element in database
    console.log('Creating element in database')
    const element = await ElementModel.create({
      elementName,
      filePath: uploadedFiles[0].filePath, // Use first file as main path
      version: 1,
      status: 'PENDING',
      reviewId: review.id
    })
    console.log('Created element:', element.id)

    // Create element versions
    console.log('Creating element versions')
    for (const version of versions) {
      await db.insert(elementVersion).values({
          elementId: element.id,
          version: version.version,
          filename: version.filename,
          filePath: version.filePath,
          fileSize: version.fileSize,
          mimeType: version.mimeType
        })
    }
    console.log('Created all versions')

    return NextResponse.json({
      status: 'success',
      message: 'Files uploaded successfully',
      data: {
        element,
        uploadedFiles: uploadedFiles.length
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const reviewId = url.searchParams.get('reviewId')

    let elements
    if (projectId) {
      elements = await ElementModel.findByProjectId(projectId)
    } else if (reviewId) {
      elements = await ElementModel.findByReviewId(reviewId)
    } else {
      elements = await ElementModel.findAll()
    }

    return NextResponse.json({
      status: 'success',
      data: elements
    })

  } catch (error) {
    console.error('Get elements error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}