import { NextRequest, NextResponse } from 'next/server'
import { ProjectModel, CreateProjectData } from '@/models/Project'

// GET - Get all projects with client information
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    
    let result
    if (clientId) {
      // Get projects for specific client
      const projects = await ProjectModel.findByClientId(clientId)
      result = {
        projects,
        total: projects.length,
        statusCounts: {
          all: projects.length,
          active: projects.filter(p => p.status === 'ACTIVE').length,
          archived: projects.filter(p => p.status === 'ARCHIVED').length,
          completed: projects.filter(p => p.status === 'COMPLETED').length,
        }
      }
    } else {
      // Get all projects with pagination
      result = await ProjectModel.findWithPagination(page, limit, search, status)
    }
    
    return NextResponse.json({
      status: 'success',
      data: result
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch projects'
    }, { status: 500 })
  }
}

// POST - Create new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Received project data:', body)
    
    const { 
      title, 
      description, 
      clientId, 
      downloadEnabled,
      status,
      emailNotifications,
      userId 
    } = body

    // Validate required fields
    if (!title || !clientId) {
      console.log('Validation failed - missing required fields:', { title, clientId })
      return NextResponse.json({
        status: 'error',
        message: 'Project title and client are required'
      }, { status: 400 })
    }

    // Get the first available user if no userId provided
    // In a real app, this would come from authentication
    let adminUserId = userId
    if (!adminUserId) {
      console.log('No userId provided, finding first user...')
      const { prisma } = await import('@/lib/prisma')
      
      try {
        const firstUser = await prisma.user.findFirst()
        console.log('First user found:', firstUser)
        
        if (!firstUser) {
          return NextResponse.json({
            status: 'error',
            message: 'No users found in database'
          }, { status: 400 })
        }
        adminUserId = firstUser.id
      } catch (dbError) {
        console.error('Database error:', dbError)
        return NextResponse.json({
          status: 'error',
          message: 'Database connection error',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 })
      }
    }

    const projectData: CreateProjectData = {
      title,
      description,
      clientId,
      downloadEnabled: downloadEnabled ?? true,
      userId: adminUserId,
      status: (status?.toUpperCase() as any) || 'ACTIVE',
      emailNotifications: emailNotifications ?? true,
      themeMode: 'system'
    }

    console.log('Creating project with data:', projectData)
    
    const project = await ProjectModel.create(projectData)
    console.log('Project created successfully:', project)

    return NextResponse.json({
      status: 'success',
      message: 'Project created successfully',
      data: project
    })
  } catch (error) {
    console.error('Create project error:', error)
    console.error('Error details:', error)
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error stack:', error.stack)
      
      // Check for specific Prisma errors
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({
          status: 'error',
          message: 'Invalid client or user reference',
          error: error.message
        }, { status: 400 })
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          status: 'error',
          message: 'Project with this title already exists',
          error: error.message
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}