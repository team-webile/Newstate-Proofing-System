import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm'
import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { createReadStream } from 'fs'
import JSZip from 'jszip'

// GET - Download approved files or specific version
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(req.url)
    const versionId = searchParams.get('version')
    const format = searchParams.get('format') || 'zip' // zip or individual

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

    // Get client data
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, project.clientId))

    if (format === 'zip') {
      // Create ZIP file with all approved files
      const zip = new JSZip()
      
      if (versionId) {
        // Download specific version
        // For now, we'll skip version-specific downloads
        // This would need to be implemented based on your versioning system
        return NextResponse.json({
          status: 'error',
          message: 'Version-specific downloads not yet implemented'
        }, { status: 501 })
      } else {
        // Download all files
        const projectDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
        
        try {
          const files = await readdir(projectDir)
          
          for (const file of files) {
            const filePath = join(projectDir, file)
            const stats = await stat(filePath)
            
            if (stats.isFile() && !file.startsWith('.')) {
              const fileBuffer = await readFile(filePath)
              zip.file(file, fileBuffer)
            }
          }
        } catch (error) {
          console.error('Error reading project files:', error)
        }
      }

      // Add approval report
      const approvalReport = generateApprovalReport(project, client)
      zip.file('approval-report.txt', approvalReport)

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${project.title}-approved-files.zip"`
        }
      })
    } else {
      // Return individual file
      if (!versionId) {
        return NextResponse.json({
          status: 'error',
          message: 'Version ID required for individual download'
        }, { status: 400 })
      }

      // Version-specific downloads not implemented

      // Individual file download not yet implemented
      return NextResponse.json({
        status: 'error',
        message: 'Individual file downloads not yet implemented'
      }, { status: 501 })
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to download files'
    }, { status: 500 })
  }
}

function generateApprovalReport(project: any, client: any): string {
  const report = `
APPROVAL REPORT
===============

Project: ${project.title}
Client: ${client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : 'N/A'}
Status: ${project.status}
Created: ${project.createdAt}
Last Activity: ${project.lastActivity}

ANNOTATIONS SUMMARY
==================
Total Annotations: 0 (not yet implemented)

No annotations available.

VERSIONS
========
No versions available.

This report was generated on ${new Date().toISOString()}
  `.trim()

  return report
}
