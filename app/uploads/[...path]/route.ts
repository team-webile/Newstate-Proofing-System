import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { extname } from 'path'

// Serve uploaded files
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    
    // Check if file exists
    try {
      await stat(filePath)
    } catch (error) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Get file extension for content type
    const ext = extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.psd':
        contentType = 'image/vnd.adobe.photoshop'
        break
      case '.ai':
        contentType = 'application/postscript'
        break
      case '.eps':
        contentType = 'application/postscript'
        break
    }
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('File serving error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
