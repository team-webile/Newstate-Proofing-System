import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { createReadStream } from 'fs'
import JSZip from 'jszip'

const prisma = new PrismaClient()

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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectVersions: true,
        annotations: {
          include: {
            replies: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({
        status: 'error',
        message: 'Project not found'
      }, { status: 404 })
    }

    if (format === 'zip') {
      // Create ZIP file with all approved files
      const zip = new JSZip()
      
      if (versionId) {
        // Download specific version
        const version = project.projectVersions.find(v => v.id === versionId)
        if (!version) {
          return NextResponse.json({
            status: 'error',
            message: 'Version not found'
          }, { status: 404 })
        }

        const filePath = join(process.cwd(), 'public', version.filePath)
        const fileBuffer = await readFile(filePath)
        zip.file(version.fileName, fileBuffer)
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
      const approvalReport = generateApprovalReport(project)
      zip.file('approval-report.txt', approvalReport)

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      return new NextResponse(zipBuffer, {
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

      const version = project.projectVersions.find(v => v.id === versionId)
      if (!version) {
        return NextResponse.json({
          status: 'error',
          message: 'Version not found'
        }, { status: 404 })
      }

      const filePath = join(process.cwd(), 'public', version.filePath)
      const fileBuffer = await readFile(filePath)

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': version.mimeType,
          'Content-Disposition': `attachment; filename="${version.fileName}"`
        }
      })
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to download files'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

function generateApprovalReport(project: any): string {
  const report = `
APPROVAL REPORT
===============

Project: ${project.title}
Client: ${project.client?.name || 'N/A'}
Status: ${project.status}
Created: ${project.createdAt}
Last Activity: ${project.lastActivity}

ANNOTATIONS SUMMARY
==================
Total Annotations: ${project.annotations.length}

${project.annotations.map((annotation: any, index: number) => `
${index + 1}. ${annotation.content}
   - Added by: ${annotation.addedByName}
   - Status: ${annotation.status}
   - Date: ${annotation.createdAt}
   - Replies: ${annotation.replies?.length || 0}
`).join('')}

VERSIONS
========
${project.projectVersions.map((version: any, index: number) => `
${index + 1}. ${version.versionName}
   - File: ${version.fileName}
   - Size: ${(version.fileSize / 1024).toFixed(2)} KB
   - Created: ${version.createdAt}
`).join('')}

This report was generated on ${new Date().toISOString()}
  `.trim()

  return report
}
