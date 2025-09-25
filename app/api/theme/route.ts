import { NextRequest, NextResponse } from 'next/server'
import { SettingsModel } from '@/models/Settings'
import { withAuth, AuthUser } from '@/lib/auth'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === 'GET') {
      const settings = await SettingsModel.findByUserId(user.id)
      
      if (!settings) {
        // Create default settings with theme preferences
        const defaultSettings = await SettingsModel.create({
          userId: user.id,
          approvalMessage: 'Thank you for your approval!',
          signatureMessage: 'By signing below, I approve this design element.',
          companyName: 'New State Branding',
          themeMode: 'system',
          borderRadius: '0.625rem',
          fontFamily: 'Inter'
        })
        
        return NextResponse.json({
          status: 'success',
          message: 'Theme settings retrieved successfully',
          data: {
            themeMode: defaultSettings.themeMode,
            primaryColor: defaultSettings.primaryColor,
            secondaryColor: defaultSettings.secondaryColor,
            accentColor: defaultSettings.accentColor,
            borderRadius: defaultSettings.borderRadius,
            fontFamily: defaultSettings.fontFamily,
            logoUrl: defaultSettings.logoUrl,
            faviconUrl: defaultSettings.faviconUrl,
            customCss: defaultSettings.customCss
          }
        })
      }

      return NextResponse.json({
        status: 'success',
        message: 'Theme settings retrieved successfully',
        data: {
          themeMode: settings.themeMode,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          accentColor: settings.accentColor,
          borderRadius: settings.borderRadius,
          fontFamily: settings.fontFamily,
          logoUrl: settings.logoUrl,
          faviconUrl: settings.faviconUrl,
          customCss: settings.customCss
        }
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { 
        themeMode,
        primaryColor,
        secondaryColor,
        accentColor,
        borderRadius,
        fontFamily,
        logoUrl,
        faviconUrl,
        customCss
      } = body

      const updateData = {
        themeMode,
        primaryColor,
        secondaryColor,
        accentColor,
        borderRadius,
        fontFamily,
        logoUrl,
        faviconUrl,
        customCss
      }

      const settings = await SettingsModel.updateByUserId(user.id, updateData)

      return NextResponse.json({
        status: 'success',
        message: 'Theme settings updated successfully',
        data: {
          themeMode: settings.themeMode,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          accentColor: settings.accentColor,
          borderRadius: settings.borderRadius,
          fontFamily: settings.fontFamily,
          logoUrl: settings.logoUrl,
          faviconUrl: settings.faviconUrl,
          customCss: settings.customCss
        }
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Method not allowed'
    }, { status: 405 })
  } catch (error) {
    console.error('Theme API error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export const GET = withAuth(handler)
export const PUT = withAuth(handler)
