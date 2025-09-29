import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url)
      const elementId = searchParams.get('elementId')
      const projectId = searchParams.get('projectId')
      const type = searchParams.get('type')

      let approvals
      if (elementId) {
        approvals = await ApprovalModel.findByElementId(elementId)
      } else if (projectId) {
        approvals = await ApprovalModel.findByProjectId(projectId)
      } else if (type) {
        approvals = await ApprovalModel.findByType(type as any)
      } else {
        approvals = await ApprovalModel.findAll()
      }

      return NextResponse.json({
        status: 'success',
        message: 'Approvals retrieved successfully',
        data: approvals
      })
    }

    if (req.method === 'POST') {
      const data: CreateApprovalData = await req.json()

      if (!data.firstName || !data.lastName || !data.type) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'First name, last name, and type are required' 
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

      const approval = await ApprovalModel.create(data)

      // Update element or project status
      if (data.type === 'ELEMENT' && data.elementId) {
        await ElementModel.updateStatus(data.elementId, 'APPROVED')
      } else if (data.type === 'PROJECT' && data.projectId) {
        await ProjectModel.updateStatus(data.projectId, 'COMPLETED')
      }

      return NextResponse.json({
        status: 'success',
        message: 'Approval recorded successfully',
        data: approval
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Approval API error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
export const POST = withAuth(handler)
