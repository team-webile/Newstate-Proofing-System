import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.role, 'ADMIN')).limit(1)

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
    
    const [adminUser] = await db.insert(users).values({
      email: 'admin@newstatebranding.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }).returning()

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
