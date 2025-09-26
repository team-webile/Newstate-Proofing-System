import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json()

    if (!email || !newPassword) {
      return NextResponse.json({
        status: 'error',
        message: 'Email and new password are required'
      }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({
        status: 'error',
        message: 'User not found'
      }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Password reset successfully',
      data: {
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to reset password'
    }, { status: 500 })
  }
}
