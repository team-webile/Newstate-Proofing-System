import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    // The client should remove the token from localStorage
    
    return NextResponse.json({
      status: 'success',
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}
