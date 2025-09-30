import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings, annotations } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    console.log('Client project API - projectId:', projectId, 'clientId:', clientId)

    if (!clientId) {
      return NextResponse.json({
        status: 'error',
        message: 'Client ID is required'
      }, { status: 400 })
    }

    // Find project with client verification using Drizzle
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        lastActivity: projects.lastActivity,
        downloadEnabled: projects.downloadEnabled,
        emailNotifications: projects.emailNotifications,
        clientId: projects.clientId,
        userId: projects.userId,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        clientEmail: clients.email,
        userName: users.name,
        userEmail: users.email
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(users, eq(projects.userId, users.id))
      .where(and(
        eq(projects.id, projectId),
        eq(projects.clientId, clientId)
      ))

    console.log('Project found:', project)

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found or access denied'
      }, { status: 404 })
    }

    // Get approvals for this project
    const projectApprovals = await db
      .select()
      .from(approvals)
      .where(eq(approvals.projectId, projectId))
      .orderBy(desc(approvals.approvedAt))

    console.log('Approvals found:', projectApprovals.length)

    // Get annotations for this project
    const projectAnnotations = await db
      .select()
      .from(annotations)
      .where(eq(annotations.projectId, projectId))
      .orderBy(desc(annotations.createdAt))

    console.log('Annotations found:', projectAnnotations.length)

    // Transform project data for client
    const clientProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastActivity: project.lastActivity,
      client: {
        id: project.clientId,
        firstName: project.clientFirstName,
        lastName: project.clientLastName,
        email: project.clientEmail
      },
      user: {
        id: project.userId,
        name: project.userName,
        email: project.userEmail
      },
      files: [], // No projectVersions in current schema
      approvals: projectApprovals,
      annotations: projectAnnotations,
      downloadEnabled: project.downloadEnabled,
      emailNotifications: project.emailNotifications,
      publicLink: `/client/${clientId}?project=${projectId}` // Add public link
    }

    console.log('Returning client project:', clientProject)

    return NextResponse.json({
      status: 'success',
      message: 'Project retrieved successfully',
      data: clientProject
    })

  } catch (error) {
    console.error('Client project fetch error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
