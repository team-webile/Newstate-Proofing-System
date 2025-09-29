import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { withAuth, AuthUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

async function handler(req: NextRequest, user: AuthUser) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const elementId = formData.get('elementId') as string

    if (!file || !elementId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'File and element ID are required' 
      }, { status: 400 })
    }

    // Verify element exists and user has access
    const element = await db.element.findFirst({
      where: { 
        id: elementId,
        review: {
          project: {
            userId: user.id
          }
        }
      }
    })

    if (!element) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Element not found' 
      }, { status: 404 })
    }

    // Get next version number
    const latestVersion = await db.elementVersion.findFirst({
      where: { elementId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = (latestVersion?.version || 0) + 1

    // Create upload directory in public folder
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'elements', elementId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save version to database
    const version = await db.elementVersion.create({
      data: {
        version: nextVersion,
        filename: file.name,
        filePath: `/uploads/elements/${elementId}/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        elementId
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: version
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export const POST = withAuth(handler)
