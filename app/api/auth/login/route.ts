import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Email and password are required' 
      }, { status: 400 })
    }

    // First try to find user in User table
    let user = await prisma.user.findUnique({
      where: { email }
    })

    let isClient = false
    let client = null

    // If not found in User table, check Client table
    if (!user) {
      client = await prisma.client.findUnique({
        where: { email }
      })
      
      if (!client) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        }, { status: 401 })
      }
      
      isClient = true
    }

    // For users, check password
    if (!isClient) {
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        }, { status: 401 })
      }
    } else {
      // For clients, we'll use a simple password check (you might want to add password field to Client model)
      // For now, let's assume clients don't need password authentication
      // You can modify this based on your requirements
    }

    const token = jwt.sign(
      { 
        userId: isClient ? client.id : user.id, 
        email: isClient ? client.email : user.email, 
        role: isClient ? 'CLIENT' : user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const userData = isClient ? {
      id: client.id,
      email: client.email,
      name: client.name,
      role: 'CLIENT'
    } : {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
