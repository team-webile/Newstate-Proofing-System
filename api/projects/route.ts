import { NextRequest, NextResponse } from 'next/server'
import { ProjectModel } from '@/models/Project'

// GET - Get all projects with client information
export async function GET(req: NextRequest) {
  try {
    const projects = await ProjectModel.findAll()
    
    return NextResponse.json({
      status: 'success',
      data: projects
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch projects'
    }, { status: 500 })
  }
}