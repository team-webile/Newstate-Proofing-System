import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        connection: 'OK',
        userCount: users.length,
        users: users
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
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

    // Test database connection first
    await prisma.$connect()
    console.log('Database connected successfully')

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

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
  } finally {
    await prisma.$disconnect()
  }
}
