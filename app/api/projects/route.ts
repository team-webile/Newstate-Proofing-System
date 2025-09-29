import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// GET - Get all projects with client information
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    
    const offset = (page - 1) * limit
    
    let whereCondition = undefined
    const conditions = []
    
    if (clientId) {
      conditions.push(eq(projects.clientId, clientId))
    }
    
    if (status) {
      conditions.push(eq(projects.status, status as any))
    }
    
    if (search) {
      conditions.push(
        or(
          like(projects.title, `%${search}%`),
          like(projects.description, `%${search}%`)
        )
      )
    }
    
    if (conditions.length > 0) {
      whereCondition = and(...conditions)
    }
    
    // Get projects with client info
    const projectsData = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientId: projects.clientId,
        userId: projects.userId,
        downloadEnabled: projects.downloadEnabled,
        emailNotifications: projects.emailNotifications,
        lastActivity: projects.lastActivity,
        clientName: clients.name,
        clientEmail: clients.email
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(whereCondition)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(whereCondition)
    
    const total = totalResult?.count || 0
    
    // Get status counts
    const [activeCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(whereCondition || undefined, eq(projects.status, 'ACTIVE')))
    
    const [archivedCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(whereCondition || undefined, eq(projects.status, 'ARCHIVED')))
    
    const [completedCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(whereCondition || undefined, eq(projects.status, 'COMPLETED')))
    
    const result = {
      projects: projectsData,
      total,
      statusCounts: {
        all: total,
        active: activeCount?.count || 0,
        archived: archivedCount?.count || 0,
        completed: completedCount?.count || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
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
    let adminUserId = userId
    if (!adminUserId) {
      console.log('No userId provided, finding first user...')
      
      try {
        const [firstUser] = await db.select().from(users).limit(1)
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

    console.log('Creating project with data:', {
      title,
      description,
      clientId,
      downloadEnabled: downloadEnabled ?? true,
      userId: adminUserId,
      status: (status?.toUpperCase() as any) || 'ACTIVE',
      emailNotifications: emailNotifications ?? true
    })
    
    const [project] = await db
      .insert(projects)
      .values({
        title,
        description,
        clientId,
        userId: adminUserId,
        downloadEnabled: downloadEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
        status: (status?.toUpperCase() as any) || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date()
      })
      .returning()

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
      
      // Check for specific database errors
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