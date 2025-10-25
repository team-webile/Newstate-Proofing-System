import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // First check if there's a stored preview image in project description
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { description: true }
    })

    let designItem = null

    // Check if there's a stored preview image
    if (project?.description) {
      try {
        const metadata = JSON.parse(project.description)
        if (metadata.previewFileId) {
          designItem = await prisma.designItem.findUnique({
            where: { id: metadata.previewFileId },
            select: {
              fileUrl: true,
              fileName: true,
              fileType: true
            }
          })
        }
      } catch (error) {
        console.log('No stored preview metadata found')
      }
    }

    // If no stored preview, get the first design item (image) from the project's reviews
    if (!designItem) {
      designItem = await prisma.designItem.findFirst({
        where: {
          review: {
            projectId: projectId
          },
          // Only get image files, not PDFs
          OR: [
            { fileType: { contains: 'image' } },
            { fileName: { endsWith: '.jpg' } },
            { fileName: { endsWith: '.jpeg' } },
            { fileName: { endsWith: '.png' } },
            { fileName: { endsWith: '.gif' } },
            { fileName: { endsWith: '.webp' } }
          ]
        },
        orderBy: {
          createdAt: 'asc' // Get the first uploaded image
        },
        select: {
          fileUrl: true,
          fileName: true,
          fileType: true
        }
      })
    }

    if (!designItem) {
      return NextResponse.json(
        { error: 'No preview image found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      preview: {
        url: designItem.fileUrl,
        fileName: designItem.fileName,
        fileType: designItem.fileType
      }
    })

  } catch (error) {
    console.error('Error getting project preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
