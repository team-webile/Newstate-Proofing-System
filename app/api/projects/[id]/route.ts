import { NextRequest, NextResponse } from 'next/server'
import { ProjectModel, UpdateProjectData } from '@/models/Project'
import { ProjectStatus } from '@prisma/client'

// PUT - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, status, downloadEnabled, clientId, emailNotifications } = body

    const updateData: UpdateProjectData = {
      title,
      description,
      status: status as ProjectStatus,
      downloadEnabled,
      clientId,
      emailNotifications,
      lastActivity: new Date()
    }

    const project = await ProjectModel.update(id, updateData)

    return NextResponse.json({
      status: 'success',
      message: 'Project updated successfully',
      data: project
    })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to update project'
    }, { status: 500 })
  }
}

// GET - Get single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await ProjectModel.findWithDetails(id)
    
    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      data: project
    })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch project'
    }, { status: 500 })
  }
}

// DELETE - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await ProjectModel.delete(id)

    return NextResponse.json({
      status: 'success',
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to delete project'
    }, { status: 500 })
  }
}