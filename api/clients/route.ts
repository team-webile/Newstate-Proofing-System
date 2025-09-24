import { NextRequest, NextResponse } from 'next/server'
import { ClientModel, CreateClientData } from '@/models/Client'

// GET - Get all clients
export async function GET(req: NextRequest) {
  try {
    const clients = await ClientModel.findAll()
    
    return NextResponse.json({
      status: 'success',
      data: clients
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
    const { name, email, phone, company, address } = body

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
      address
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
