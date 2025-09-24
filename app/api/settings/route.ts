import { NextRequest, NextResponse } from 'next/server'
import { SettingsModel } from '@/models/Settings'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const settings = await SettingsModel.findByUserId(user.id)
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await SettingsModel.create({
          userId: user.id,
          approvalMessage: 'Thank you for your approval!',
          signatureMessage: 'By signing below, I approve this design element.',
          companyName: 'New State Branding'
        })
        
        return NextResponse.json({
          status: 'success',
          message: 'Settings retrieved successfully',
          data: defaultSettings
        })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Settings retrieved successfully',
        data: settings
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { approvalMessage, signatureMessage, companyName } = body

      const updateData = {
        approvalMessage,
        signatureMessage,
        companyName
      }

      const settings = await SettingsModel.updateByUserId(user.id, updateData)

      return NextResponse.json({
        status: 'success',
        message: 'Settings updated successfully',
        data: settings
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
export const PUT = withAuth(handler)
