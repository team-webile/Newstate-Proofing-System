import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        status: 'success',
        message: 'Admin user already exists',
        data: {
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      })
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@newstatebranding.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    })

    const { password: _, ...userWithoutPassword } = adminUser

    return NextResponse.json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        user: userWithoutPassword,
        credentials: {
          email: 'admin@newstatebranding.com',
          password: 'admin123'
        }
      }
    })

  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create admin user'
    }, { status: 500 })
  }
}
