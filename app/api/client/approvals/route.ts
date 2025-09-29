import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// Extend global to include io
declare global {
  var io: any
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Validate required fields based on actual schema
    if (!data.type || !data.signature || !data.userName) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Type, signature, and user name are required' 
      }, { status: 400 })
    }

    if (data.type === 'ELEMENT' && !data.elementId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Element ID is required for element approval' 
      }, { status: 400 })
    }

    if (data.type === 'PROJECT' && !data.projectId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Project ID is required for project approval' 
      }, { status: 400 })
    }

    // Create approval in database
    const approvalData: any = {
      type: data.type,
      signature: data.signature,
      userName: data.userName
    }
    
    if (data.elementId) {
      approvalData.elementId = data.elementId
    }
    
    if (data.projectId) {
      approvalData.projectId = data.projectId
    }
    
    const approval = await db.approval.create({
      data: approvalData
    })

    // Update element status if it's an element approval
    if (data.type === 'ELEMENT' && data.elementId) {
      await db.element.update({
        where: { id: data.elementId },
        data: { status: 'APPROVED' }
      })

      // Get project ID for Socket.IO emission
      let projectId: string | null = null
      try {
        const elementWithProject = await db.element.select().from(table).where(eq(table.id, id))
        
        if (elementWithProject?.review?.project) {
          projectId = elementWithProject.review.project.id
        }
      } catch (error) {
        console.error('Error fetching project for Socket.IO emission:', error)
      }

      // Emit Socket.IO event for real-time updates
      if (global.io && projectId) {
        global.io.to(`project-${projectId}`).emit('element-status-changed', {
          elementId: data.elementId,
          status: 'APPROVED',
          approval: approval
        })
        global.io.to(`element-${data.elementId}`).emit('element-status-changed', {
          elementId: data.elementId,
          status: 'APPROVED',
          approval: approval
        })
        console.log(`Socket.IO: Emitted element-status-changed for project ${projectId}, element ${data.elementId}`)
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Approval recorded successfully',
      data: approval
    })
  } catch (error) {
    console.error('Client approval API error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
