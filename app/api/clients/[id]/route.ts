import { NextRequest, NextResponse } from 'next/server'
import { ClientModel, UpdateClientData } from '@/models/Client'

// GET - Get client by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await ClientModel.findById(params.id)
    
    if (!client) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    // Get client with projects
    const clientWithProjects = await ClientModel.findWithProjects(params.id)
    
    return NextResponse.json({
      status: 'success',
      data: {
        ...client,
        _count: {
          projects: clientWithProjects?.projects?.length || 0
        }
      }
    })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch client'
    }, { status: 500 })
  }
}

// PUT - Update client
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if client exists
    const existingClient = await ClientModel.findById(params.id)
    if (!existingClient) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingClient.email) {
      const emailExists = await ClientModel.findByEmail(email)
      if (emailExists) {
        return NextResponse.json({
          status: 'error',
          message: 'Client with this email already exists'
        }, { status: 400 })
      }
    }

    const updateData: UpdateClientData = {
      name,
      email,
      phone,
      company,
      address,
      notes
    }

    const updatedClient = await ClientModel.update(params.id, updateData)

    return NextResponse.json({
      status: 'success',
      message: 'Client updated successfully',
      data: updatedClient
    })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to update client'
    }, { status: 500 })
  }
}

// DELETE - Delete client
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if client exists
    const existingClient = await ClientModel.findById(params.id)
    if (!existingClient) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    await ClientModel.delete(params.id)

    return NextResponse.json({
      status: 'success',
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to delete client'
    }, { status: 500 })
  }
}
