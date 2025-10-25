import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const { fileId } = await request.json()

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Verify the file belongs to this project
    const designItem = await prisma.designItem.findFirst({
      where: {
        id: fileId,
        review: {
          projectId: projectId
        }
      },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        fileType: true
      }
    })

    if (!designItem) {
      return NextResponse.json(
        { error: 'File not found or does not belong to this project' },
        { status: 404 }
      )
    }

    // Check if it's an image file
    const isImage = designItem.fileType?.includes('image') || 
                   designItem.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

    if (!isImage) {
      return NextResponse.json(
        { error: 'Only image files can be set as preview' },
        { status: 400 }
      )
    }

    // Update the project's preview metadata
    await prisma.project.update({
      where: { id: projectId },
      data: {
        previewMetadata: {
          previewFileId: fileId,
          previewUrl: designItem.fileUrl,
          previewFileName: designItem.fileName,
          previewFileType: designItem.fileType
        }
      } as any
    })

    return NextResponse.json({
      success: true,
      message: 'Preview image set successfully',
      preview: {
        fileId: designItem.id,
        url: designItem.fileUrl,
        fileName: designItem.fileName,
        fileType: designItem.fileType
      }
    })

  } catch (error) {
    console.error('Error setting project preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
