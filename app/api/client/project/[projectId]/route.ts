import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({
        status: 'error',
        message: 'Client ID is required'
      }, { status: 400 })
    }

    // Find project with client verification
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: clientId
      },
      include: {
        client: true,
        user: true,
        approvals: true,
        annotations: true
      }
    })

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found or access denied'
      }, { status: 404 })
    }

    // Transform project data for client
    const clientProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastActivity: project.updatedAt, // Use updatedAt as lastActivity
      client: project.client,
      user: project.user,
      files: [], // No projectVersions in current schema
      approvals: project.approvals,
      annotations: project.annotations,
      downloadEnabled: project.downloadEnabled,
      emailNotifications: project.emailNotifications,
      publicLink: `/client/${clientId}?project=${projectId}` // Add public link
    }

    return NextResponse.json({
      status: 'success',
      message: 'Project retrieved successfully',
      data: clientProject
    })

  } catch (error) {
    console.error('Client project fetch error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch project'
    }, { status: 500 })
  }
}
