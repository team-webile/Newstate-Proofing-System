import { NextRequest, NextResponse } from "next/server"
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `logo-${timestamp}.${fileExtension}`
    
    // Save to public/images directory
    const path = join(process.cwd(), 'public', 'images', fileName)
    await writeFile(path, buffer)

    // Return the public URL
    const fileUrl = `/images/${fileName}`

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileName 
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
