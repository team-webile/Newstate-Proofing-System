import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings, versions } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'

// POST - Create new version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await req.json()
    const { version, description } = body

    if (!version) {
      return NextResponse.json({
        status: 'error',
        message: 'Version name is required'
      }, { status: 400 })
    }

    // Verify project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Check if version already exists
    const [existingVersion] = await db
      .select()
      .from(versions)
      .where(and(
        eq(versions.projectId, projectId),
        eq(versions.version, version)
      ))

    if (existingVersion) {
      return NextResponse.json({
        status: 'error',
        message: 'Version already exists'
      }, { status: 400 })
    }

    // Create new version in database
    const [newVersion] = await db
      .insert(versions)
      .values({
        version,
        description: description || '',
        projectId,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
    
    return NextResponse.json({
      status: 'success',
      message: 'Version created successfully',
      data: newVersion
    })

  } catch (error) {
    console.error('Create version error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create version'
    }, { status: 500 })
  }
}

// GET - Get all versions for project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    // Verify project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    // Fetch versions from database
    const versionsList = await db
      .select()
      .from(versions)
      .where(eq(versions.projectId, projectId))
      .orderBy(asc(versions.createdAt))

    // If no versions exist, create a default V1 version
    if (versionsList.length === 0) {
      const [defaultVersion] = await db
        .insert(versions)
        .values({
          version: 'V1',
          description: 'Initial Version',
          projectId,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
      versionsList.push(defaultVersion)
    }

    return NextResponse.json({
      status: 'success',
      data: versionsList
    })

  } catch (error) {
    console.error('Get versions error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch versions'
    }, { status: 500 })
  }
}