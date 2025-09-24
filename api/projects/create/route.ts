import { NextRequest, NextResponse } from 'next/server'
import { ProjectModel, CreateProjectData } from '@/models/Project'
import { ClientModel } from '@/models/Client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, downloadEnabled, clientId, userId } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({
        status: 'error',
        message: 'Project title is required'
      }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({
        status: 'error',
        message: 'Client ID is required'
      }, { status: 400 })
    }

    // Use the actual admin user ID
    const defaultUserId = userId || 'cmfthsp2v00007jjgptguqzdm'

    // Verify client exists
    const client = await ClientModel.findById(clientId)
    if (!client) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    const projectData: CreateProjectData = {
      title,
      description,
      downloadEnabled: downloadEnabled ?? true,
      userId: defaultUserId,
      clientId
    }

    const project = await ProjectModel.create(projectData)

    return NextResponse.json({
      status: 'success',
      message: 'Project created successfully',
      data: project
    })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create project'
    }, { status: 500 })
  }
}