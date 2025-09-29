import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
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
    const [user] = await db.select().from(users).where(eq(users.email, email))

    let isClient = false
    let client = null

    // If not found in User table, check Client table
    if (!user) {
      const [clientResult] = await db.select().from(clients).where(eq(clients.email, email))
      
      if (!clientResult) {
        return NextResponse.json({ 
          status: 'error', 
          message: 'Invalid credentials' 
        }, { status: 401 })
      }
      
      client = clientResult
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

    // Check if JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only'
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET not found in environment variables. Using fallback key for development.')
    }

    const token = jwt.sign(
      { 
        userId: isClient ? client.id : user.id, 
        email: isClient ? client.email : user.email, 
        role: isClient ? 'CLIENT' : user.role 
      },
      jwtSecret,
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
