import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, projects } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
// GET - Get all clients with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    // Calculate offset
    const offset = (page - 1) * limit
    
    // Get paginated clients with search
    let whereCondition = undefined
    if (search) {
      whereCondition = or(
        like(clients.firstName, `%${search}%`),
        like(clients.lastName, `%${search}%`),
        like(clients.email, `%${search}%`),
        like(clients.company, `%${search}%`)
      )
    }

    const [clientsResult, totalCount] = await Promise.all([
      db
        .select()
        .from(clients)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(clients.createdAt)),
      db
        .select({ count: count() })
        .from(clients)
        .where(whereCondition)
    ])

    const total = totalCount[0]?.count || 0
    
    // Add project count to each client
    const clientsWithCounts = await Promise.all(
      clientsResult.map(async (client) => {
        const [projectCount] = await db
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.clientId, client.id))
        
        return {
          ...client,
          _count: {
            projects: projectCount?.count || 0
          }
        }
      })
    )
    
    return NextResponse.json({
      status: 'success',
      data: {
        clients: clientsWithCounts,
        pagination: {
          page,
          limit,
          total: total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch clients'
    }, { status: 500 })
  }
}

// POST - Create new client
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/clients - Starting request')
    const body = await req.json()
    console.log('POST /api/clients - Request body:', body)
    
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      company, 
      address, 
      notes
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.log('POST /api/clients - Missing required fields')
      return NextResponse.json({
        status: 'error',
        message: 'Client first name, last name and email are required'
      }, { status: 400 })
    }

    console.log('POST /api/clients - Checking for existing client')
    // Check if client with this email already exists
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, email))
    
    if (existingClient) {
      console.log('POST /api/clients - Client already exists')
      return NextResponse.json({
        status: 'error',
        message: 'Client with this email already exists'
      }, { status: 400 })
    }

    console.log('POST /api/clients - Creating new client')
    const [client] = await db
      .insert(clients)
      .values({
        firstName,
        lastName,
        email,
        phone,
        company,
        address,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    console.log('POST /api/clients - Client created successfully:', client)
    return NextResponse.json({
      status: 'success',
      message: 'Client created successfully',
      data: client
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create client',
      error: error.message
    }, { status: 500 })
  }
}
