import { NextRequest, NextResponse } from 'next/server'
import { ClientModel, CreateClientData } from '@/models/Client'

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
    const result = await ClientModel.findWithPagination({
      page,
      limit,
      offset,
      search
    })
    
    // Add project count to each client
    const clientsWithCounts = await Promise.all(
      result.clients.map(async (client) => {
        const clientWithProjects = await ClientModel.findWithProjects(client.id)
        return {
          ...client,
          _count: {
            projects: clientWithProjects?.projects?.length || 0
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
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
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
    const body = await req.json()
    const { 
      name, 
      email, 
      phone, 
      company, 
      address, 
      notes
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({
        status: 'error',
        message: 'Client name and email are required'
      }, { status: 400 })
    }

    // Check if client with this email already exists
    const existingClient = await ClientModel.findByEmail(email)
    if (existingClient) {
      return NextResponse.json({
        status: 'error',
        message: 'Client with this email already exists'
      }, { status: 400 })
    }

    const clientData: CreateClientData = {
      name,
      email,
      phone,
      company,
      address,
      notes
    }

    const client = await ClientModel.create(clientData)

    return NextResponse.json({
      status: 'success',
      message: 'Client created successfully',
      data: client
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create client'
    }, { status: 500 })
  }
}
