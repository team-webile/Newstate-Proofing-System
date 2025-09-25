import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        reviews: true
      }
    })

    return NextResponse.json({
      status: 'success',
      data: {
        projects,
        count: projects.length
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch projects',
      error: error.message
    }, { status: 500 })
  }
}
