import { NextRequest, NextResponse } from 'next/server'
import { ElementModel, UpdateElementData } from '@/models/Element'
import { withAuth, AuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Extend global to include io
declare global {
  var io: any
}

async function handler(
  req: NextRequest, 
  user: AuthUser
) {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (req.method === 'GET') {
      const element = await ElementModel.findWithDetails(id)
      
      if (!element) {
        return NextResponse.json({
          status: 'error',
          message: 'Element not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Element retrieved successfully',
        data: element
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { name, description, status } = body

      const updateData: UpdateElementData = {
        elementName: name,
        status
      }

      const element = await ElementModel.update(id, updateData)

      // Emit Socket.IO event if status was updated
      if (status) {
        try {
          // Get project ID for Socket.IO emission
          const elementWithProject = await prisma.element.findUnique({
            where: { id },
            include: {
              review: {
                include: {
                  project: true
                }
              }
            }
          })
          
          if (elementWithProject?.review?.project && global.io) {
            const projectId = elementWithProject.review.project.id
            
            global.io.to(`project-${projectId}`).emit('element-status-changed', {
              elementId: id,
              status: status,
              updatedBy: 'Admin'
            })
            global.io.to(`element-${id}`).emit('element-status-changed', {
              elementId: id,
              status: status,
              updatedBy: 'Admin'
            })
            console.log(`Socket.IO: Emitted element-status-changed for project ${projectId}, element ${id}, status: ${status}`)
            console.log(`Socket.IO: Rooms: project-${projectId}, element-${id}`)
          } else {
            console.log('Socket.IO: No global.io or project data available for emission')
          }
        } catch (error) {
          console.error('Error emitting Socket.IO event:', error)
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Element updated successfully',
        data: element
      })
    }

    if (req.method === 'DELETE') {
      await ElementModel.delete(id)

      return NextResponse.json({
        status: 'success',
        message: 'Element deleted successfully'
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Element API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
export const PUT = withAuth(handler)
export const DELETE = withAuth(handler)
