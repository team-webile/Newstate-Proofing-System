import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface JWTPayload {
  userId: number
  email: string
  role: string
  iat: number
  exp: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('admin-token')?.value
  
  if (!token) {
    return null
  }
  
  return verifyToken(token)
}

export async function getTokenFromCookies(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')?.value
  
  if (!token) {
    return null
  }
  
  return verifyToken(token)
}

export async function setAuthCookie(token: string, response: Response): Promise<Response> {
  response.cookies.set('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  return response
}

export async function clearAuthCookie(response: Response): Promise<Response> {
  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  
  return response
}

export function isAdmin(payload: JWTPayload | null): boolean {
  return payload?.role === 'ADMIN'
}

export function isAuthenticated(payload: JWTPayload | null): boolean {
  return payload !== null
}
