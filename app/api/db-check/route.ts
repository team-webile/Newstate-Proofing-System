import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    // Test database connection by querying users
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt
    }).from(users)

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        connection: 'OK',
        userCount: allUsers.length,
        users: allUsers
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('DB Check Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Email and password are required' 
      }, { status: 400 })
    }

    console.log('Database connected successfully')

    // Find user by email using Drizzle
    const [user] = await db.select().from(users).where(eq(users.email, email))

    console.log('User found:', user ? 'Yes' : 'No')
    console.log('User details:', user ? { id: user.id, email: user.email, name: user.name, role: user.role } : 'No user')

    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json({ 
        status: 'error', 
        message: 'User not found' 
      }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValidPassword)

    if (!isValidPassword) {
      console.log('Invalid password for user:', email)
      return NextResponse.json({ 
        status: 'error', 
        message: 'Invalid password' 
      }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    console.log('Login successful for user:', user.email)

    return NextResponse.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        databaseStatus: 'Connected'
      }
    })
  } catch (error) {
    console.error('DB Check Login error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
