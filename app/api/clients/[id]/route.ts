import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, projects } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
// GET - Get client by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
    
    if (!client) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    // Get project count for this client
    const [projectCount] = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.clientId, id))
    
    return NextResponse.json({
      status: 'success',
      data: {
        ...client,
        _count: {
          projects: projectCount?.count || 0
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
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
      return NextResponse.json({
        status: 'error',
        message: 'Client first name, last name and email are required'
      }, { status: 400 })
    }

    // Check if client exists
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
    
    if (!existingClient) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    // Check if email is being changed and if new email already exists
    if (email !== existingClient.email) {
      const [emailExists] = await db
        .select()
        .from(clients)
        .where(eq(clients.email, email))
      
      if (emailExists) {
        return NextResponse.json({
          status: 'error',
          message: 'Client with this email already exists'
        }, { status: 400 })
      }
    }

    const [updatedClient] = await db
      .update(clients)
      .set({
        firstName,
        lastName,
        email,
        phone,
        company,
        address,
        notes,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning()

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if client exists
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
    
    if (!existingClient) {
      return NextResponse.json({
        status: 'error',
        message: 'Client not found'
      }, { status: 404 })
    }

    await db
      .delete(clients)
      .where(eq(clients.id, id))

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
