import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth, AuthUser } from '@/lib/auth'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

// Helper function to get project files
async function getProjectFiles(projectId: string) {
  try {
    const projectDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
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
        fullUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://preview.devnstage.xyz'}/uploads/projects/${projectId}/${file}`,
        type: getMimeType(file),
        size: stats.size,
        uploadedAt: stats.mtime.toISOString(),
        version: 'V1' // Default version
      })
    }
    
    return fileList
  } catch (error) {
    console.log('No project files found:', error)
    return []
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
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
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

// GET handler without authentication
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    console.log('Fetching review with ID:', id)

    // Enhanced review query with complete data
    const review = await db.review.select().from(table).where(eq(table.id, id))
    
    if (!review) {
      console.log('Review not found, checking if it might be a project ID...')
      
      // Check if this might be a project ID instead of review ID
      const project = await db.project.select().from(table).where(eq(table.id, id))
      
      if (project) {
        console.log('Found project, checking if review already exists...')
        
        // Check if review already exists for this project
        const existingReview = await db.review.findFirst({
          where: { projectId: project.id }
        })
        
        if (existingReview) {
          console.log('Review already exists, returning existing review...')
          const existingReviewWithData = await db.review.select().from(table).where(eq(table.id, id))

          // Transform existing review data
          if (!existingReviewWithData) {
            return NextResponse.json({
              status: 'error',
              message: 'Failed to retrieve existing review'
            }, { status: 500 })
          }

          // Get project files for existing review
          const existingProjectFiles = await getProjectFiles(existingReviewWithData.project.id)

          const transformedExistingReview = {
            id: existingReviewWithData.id,
            reviewName: existingReviewWithData.reviewName,
            description: existingReviewWithData.description,
            status: existingReviewWithData.status,
            shareLink: existingReviewWithData.shareLink,
            createdAt: existingReviewWithData.createdAt,
            updatedAt: existingReviewWithData.updatedAt,
            project: {
              id: existingReviewWithData.project.id,
              title: existingReviewWithData.project.title,
              description: existingReviewWithData.project.description,
              status: existingReviewWithData.project.status,
              downloadEnabled: existingReviewWithData.project.downloadEnabled,
            emailNotifications: (existingReviewWithData.project as any).emailNotifications || true,
            lastActivity: (existingReviewWithData.project as any).lastActivity || existingReviewWithData.project.updatedAt,
              createdAt: existingReviewWithData.project.createdAt,
              updatedAt: existingReviewWithData.project.updatedAt,
              client: existingReviewWithData.project.client,
              user: existingReviewWithData.project.user,
              files: existingProjectFiles // Add project files with images
            },
            elements: existingReviewWithData.elements.map((element: any) => ({
              id: element.id,
              elementName: element.elementName,
              status: element.status,
              createdAt: element.createdAt,
              updatedAt: element.updatedAt,
              versions: element.versions.map((version: any) => ({
                id: version.id,
                filename: version.filename,
                filePath: version.filePath,
                fileSize: version.fileSize,
                mimeType: version.mimeType,
                createdAt: version.createdAt,
                // Add full URL for images
                imageUrl: version.filePath ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://preview.devnstage.xyz'}${version.filePath}` : null
              })),
              comments: element.comments,
              approvals: element.approvals
            }))
          }
          
          return NextResponse.json({
            status: 'success',
            message: 'Review retrieved successfully',
            data: transformedExistingReview
          })
        }
        
        console.log('Creating new review for project...')
        // Create a review for this project with unique shareLink
        const uniqueShareLink = `review-${project.id}-${Date.now()}`
        const newReview = await ReviewModel.create({
          reviewName: `Review for ${project.title}`,
          description: `Review for project: ${project.title}`,
          projectId: project.id,
          shareLink: uniqueShareLink,
          updatedAt: new Date()
        })
        
        // Return the newly created review with complete data
        const newReviewWithData = await db.review.select().from(table).where(eq(table.id, id))

        // Transform the new review data
        if (!newReviewWithData) {
          return NextResponse.json({
            status: 'error',
            message: 'Failed to create review'
          }, { status: 500 })
        }

        // Get project files for new review
        const newProjectFiles = await getProjectFiles(newReviewWithData.project.id)

        const transformedNewReview = {
          id: newReviewWithData.id,
          reviewName: newReviewWithData.reviewName,
          description: newReviewWithData.description,
          status: newReviewWithData.status,
          shareLink: newReviewWithData.shareLink,
          createdAt: newReviewWithData.createdAt,
          updatedAt: newReviewWithData.updatedAt,
          project: {
            id: newReviewWithData.project.id,
            title: newReviewWithData.project.title,
            description: newReviewWithData.project.description,
            status: newReviewWithData.project.status,
            downloadEnabled: newReviewWithData.project.downloadEnabled,
            emailNotifications: (newReviewWithData.project as any).emailNotifications || true,
            lastActivity: (newReviewWithData.project as any).lastActivity || newReviewWithData.project.updatedAt,
            createdAt: newReviewWithData.project.createdAt,
            updatedAt: newReviewWithData.project.updatedAt,
            client: newReviewWithData.project.client,
            user: newReviewWithData.project.user,
            files: newProjectFiles // Add project files with images
          },
          elements: newReviewWithData.elements.map((element: any) => ({
            id: element.id,
            elementName: element.elementName,
            status: element.status,
            createdAt: element.createdAt,
            updatedAt: element.updatedAt,
            versions: element.versions.map((version: any) => ({
              id: version.id,
              filename: version.filename,
              filePath: version.filePath,
              fileSize: version.fileSize,
              mimeType: version.mimeType,
              createdAt: version.createdAt,
              // Add full URL for images
              imageUrl: version.filePath ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://preview.devnstage.xyz'}${version.filePath}` : null
            })),
            comments: element.comments,
            approvals: element.approvals
          }))
        }
        
        return NextResponse.json({
          status: 'success',
          message: 'Review created and retrieved successfully',
          data: transformedNewReview
        })
      }
      
      return NextResponse.json({
        status: 'error',
        message: 'Review not found',
        debug: {
          requestedId: id,
          suggestion: 'Check if the ID is correct or if you meant to access a project'
        }
      }, { status: 404 })
    }

    // Get project files
    const projectFiles = await getProjectFiles(review.project.id)

    // Transform the data to include all necessary information
    const transformedReview = {
      id: review.id,
      reviewName: review.reviewName,
      description: review.description,
      status: review.status,
      shareLink: review.shareLink,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      project: {
        id: review.project.id,
        title: review.project.title,
        description: review.project.description,
        status: review.project.status,
        downloadEnabled: review.project.downloadEnabled,
        emailNotifications: (review.project as any).emailNotifications || true,
        lastActivity: (review.project as any).lastActivity || review.project.updatedAt,
        createdAt: review.project.createdAt,
        updatedAt: review.project.updatedAt,
        client: review.project.client,
        user: review.project.user,
        files: projectFiles // Add project files with images
      },
      elements: review.elements.map((element: any) => ({
        id: element.id,
        elementName: element.elementName,
        status: element.status,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt,
        versions: element.versions.map((version: any) => ({
          id: version.id,
          filename: version.filename,
          filePath: version.filePath,
          fileSize: version.fileSize,
          mimeType: version.mimeType,
          createdAt: version.createdAt,
          // Add full URL for images
          imageUrl: version.filePath ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://preview.devnstage.xyz'}${version.filePath}` : null
        })),
        comments: element.comments,
        approvals: element.approvals
      }))
    }

    return NextResponse.json({
      status: 'success',
      message: 'Review retrieved successfully',
      data: transformedReview
    })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT and DELETE handlers with authentication
async function handler(
  req: NextRequest, 
  user: AuthUser
) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (req.method === 'PUT') {
      const body = await req.json()
      const { reviewName, description, status } = body

      const updateData: UpdateReviewData = {
        reviewName,
        description,
        status
      }

      const review = await ReviewModel.update(id, updateData)

      return NextResponse.json({
        status: 'success',
        message: 'Review updated successfully',
        data: review
      })
    }

    if (req.method === 'DELETE') {
      await ReviewModel.delete(id)

      return NextResponse.json({
        status: 'success',
        message: 'Review deleted successfully'
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const PUT = withAuth(handler)
export const DELETE = withAuth(handler)
