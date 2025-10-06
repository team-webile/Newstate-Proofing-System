import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to get existing settings from database
    let settings = await prisma.settings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: 'Proofing System',
          siteDescription: 'Professional design proofing and client feedback system',
          adminEmail: 'admin@proofing-system.com',
          logoUrl: '/images/nsb-logo.png',
        }
      })
    }

    return NextResponse.json({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      adminEmail: settings.adminEmail,
      logoUrl: settings.logoUrl,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    // Try to get existing settings
    let settings = await prisma.settings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          siteName: data.siteName || settings.siteName,
          siteDescription: data.siteDescription || settings.siteDescription,
          adminEmail: data.adminEmail || settings.adminEmail,
          logoUrl: data.logoUrl || settings.logoUrl,
        }
      })
    } else {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: {
          siteName: data.siteName || 'Proofing System',
          siteDescription: data.siteDescription || 'Professional design proofing and client feedback system',
          adminEmail: data.adminEmail || 'admin@proofing-system.com',
          logoUrl: data.logoUrl || '/images/nsb-logo.png',
        }
      })
    }

    console.log("Settings updated in database:", settings)
    
    return NextResponse.json({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      adminEmail: settings.adminEmail,
      logoUrl: settings.logoUrl,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
