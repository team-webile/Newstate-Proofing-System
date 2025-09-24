import { NextRequest, NextResponse } from 'next/server'
import { CommentModel, CreateCommentData } from '@/models/Comment'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url)
      const elementId = searchParams.get('elementId')
      const type = searchParams.get('type')

      let comments
      if (elementId) {
        comments = await CommentModel.findByElementId(elementId)
      } else if (type) {
        comments = await CommentModel.findByType(type as any)
      } else {
        comments = await CommentModel.findAll()
      }

      return NextResponse.json({
        status: 'success',
        message: 'Comments retrieved successfully',
        data: comments
      })
    }

    if (req.method === 'POST') {
      const data: CreateCommentData = await req.json()

      if (!data.content || !data.elementId) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Content and element ID are required' 
        }, { status: 400 })
      }

      const comment = await CommentModel.create(data)

      return NextResponse.json({
        status: 'success',
        message: 'Comment added successfully',
        data: comment
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Comment API error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
export const POST = withAuth(handler)
