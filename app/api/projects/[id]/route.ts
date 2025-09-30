import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// PUT - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, status, downloadEnabled, clientId, emailNotifications } = body

    const [project] = await db
      .update(projects)
      .set({
        title,
        description,
        status: status as any,
        downloadEnabled,
        clientId,
        emailNotifications,
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning()

    // Emit socket event for real-time updates
    try {
      // Get socket server from global (set by server.js)
      const io = (global as any).socketServer;
      
      if (io) {
        // Determine if this is from admin or client
        const referer = req.headers.get('referer') || ''
        const userAgent = req.headers.get('user-agent') || ''
        const isFromAdmin = referer.includes('/admin/') || userAgent.includes('admin') || req.url.includes('/admin/')
        
        console.log('🔍 Project status update detection:', { referer, userAgent, isFromAdmin, url: req.url })
        
        // Emit project status change event
        io.to(`project-${id}`).emit('projectStatusChanged', {
          projectId: id,
          status: status,
          changedBy: isFromAdmin ? 'Admin' : 'Client',
          changedByName: isFromAdmin ? 'Admin' : 'Client',
          timestamp: new Date().toISOString(),
          isFromAdmin: isFromAdmin
        })
        
        // Send notification to opposite user type
        if (isFromAdmin) {
          // Admin changed project status, notify client
          io.to(`project-${id}`).emit('statusNotification', {
            type: 'project_status_changed',
            message: `Admin updated project status to ${status}`,
            from: 'Admin',
            to: 'Client',
            projectId: id,
            status: status,
            timestamp: new Date().toISOString()
          })
        } else {
          // Client changed project status, notify admin
          io.to(`project-${id}`).emit('statusNotification', {
            type: 'project_status_changed',
            message: `Client updated project status to ${status}`,
            from: 'Client',
            to: 'Admin',
            projectId: id,
            status: status,
            timestamp: new Date().toISOString()
          })
        }
        
        console.log(`📡 Emitted projectStatusChanged for project ${id}`)
      }
    } catch (error) {
      console.error('Error emitting socket event:', error)
    }

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
    
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        userId: projects.userId,
        clientId: projects.clientId,
        downloadEnabled: projects.downloadEnabled,
        emailNotifications: projects.emailNotifications,
        lastActivity: projects.lastActivity,
        primaryColor: projects.primaryColor,
        secondaryColor: projects.secondaryColor,
        accentColor: projects.accentColor,
        customCss: projects.customCss,
        logoUrl: projects.logoUrl,
        themeMode: projects.themeMode,
        client: clients,
        user: users,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(users, eq(projects.userId, users.id))
      .where(eq(projects.id, id))
    
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
    
    await db
      .delete(projects)
      .where(eq(projects.id, id))

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