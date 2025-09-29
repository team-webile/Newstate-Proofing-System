import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath)
    
    const file = await readFile(fullPath)
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'psd':
        contentType = 'image/vnd.adobe.photoshop'
        break
      case 'ai':
        contentType = 'application/postscript'
        break
      case 'eps':
        contentType = 'application/postscript'
        break
    }
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('File serving error:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
