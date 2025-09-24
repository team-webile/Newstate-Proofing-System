import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  userId?: string
  email: string
  name?: string
  role: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    // Handle both id and userId fields
    return {
      id: decoded.id || decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch {
    return null
  }
}

export function withAuth(handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || req.cookies.get('token')?.value
      
      if (!token) {
        return NextResponse.json({ status: 'error', message: 'No token provided' }, { status: 401 })
      }

      const user = verifyToken(token)
      if (!user) {
        return NextResponse.json({ status: 'error', message: 'Invalid token' }, { status: 401 })
      }

      return handler(req, user)
    } catch {
      return NextResponse.json({ status: 'error', message: 'Authentication failed' }, { status: 401 })
    }
  }
}

// Helper function to get user from request
export function getUserFromRequest(req: NextRequest): AuthUser | null {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('token')?.value

    if (!token) return null

    return verifyToken(token)
  } catch {
    return null
  }
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '7d' })
}
