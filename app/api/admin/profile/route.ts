import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const updateProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If new password is provided, confirm password must match
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// GET - Get current admin profile
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request)
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update admin profile (email and/or password)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request)
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, currentPassword, newPassword } = result.data

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }

      updateData.email = email
    }

    // Update password if provided
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No changes to update' },
        { status: 400 }
      )
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    })

    // If email was updated, generate new JWT token
    let newToken = null
    if (updateData.email) {
      newToken = signToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      emailChanged: !!updateData.email,
      passwordChanged: !!updateData.password,
    })

    // Update auth cookie if email changed
    if (newToken) {
      response.cookies.set('admin-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

