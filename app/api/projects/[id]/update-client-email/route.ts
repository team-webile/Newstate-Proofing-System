import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addToEmailQueue } from '@/lib/email-queue'
import { createActivityLog } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    const { clientEmail } = await request.json()

    if (!clientEmail || !clientEmail.trim()) {
      return NextResponse.json(
        { error: 'Client email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get the current project data before updating
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientEmail: true,
        projectNumber: true
      }
    })

    if (!currentProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update the project's client email
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { clientEmail: clientEmail.trim() },
      select: {
        id: true,
        name: true,
        clientEmail: true,
        projectNumber: true
      }
    })

    // Create activity log entry for admin tracking
    if (currentProject.clientEmail !== clientEmail.trim()) {
      try {
        await createActivityLog({
          projectId: projectId,
          userName: 'Client',
          action: 'Email Updated',
          details: `Client email changed from ${currentProject.clientEmail} to ${clientEmail.trim()}`
        })
      } catch (logError) {
        console.error('Failed to create activity log:', logError)
      }

      // Send email notification to the new email address
      try {
        await addToEmailQueue({
          to: clientEmail.trim(),
          subject: `Email Updated - Project ${updatedProject.projectNumber}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #fdb913, #e5a711); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: #000; margin: 0; font-size: 24px;">Email Updated Successfully!</h1>
              </div>
              
              <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; color: #fff;">
                <h2 style="color: #fdb913; margin-top: 0;">Project: ${updatedProject.projectNumber} - ${updatedProject.name}</h2>
                
                <p>Your email address has been successfully updated for this project.</p>
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p style="margin: 0;"><strong>New Email:</strong> ${clientEmail.trim()}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Previous Email:</strong> ${currentProject.clientEmail}</p>
                </div>
                
                <p>You will now receive all project notifications at your new email address.</p>
                
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" 
                     style="background: #fdb913; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    View Project
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                <p>This email was sent because your email address was updated for project ${updatedProject.projectNumber}.</p>
              </div>
            </div>
          `,
          textContent: `
            Email Updated Successfully!
            
            Project: ${updatedProject.projectNumber} - ${updatedProject.name}
            
            Your email address has been updated:
            New Email: ${clientEmail.trim()}
            Previous Email: ${currentProject.clientEmail}
            
            You will now receive all project notifications at your new email address.
            
            View your project: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
          `,
          metadata: {
            type: 'email_update_notification',
            projectId: projectId,
            projectNumber: updatedProject.projectNumber,
            projectName: updatedProject.name,
            oldEmail: currentProject.clientEmail,
            newEmail: clientEmail.trim()
          }
        })
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    // Note: Socket event is emitted from the client side (welcome modal)
    // This ensures real-time updates without server-side socket dependencies

    return NextResponse.json({
      success: true,
      message: 'Client email updated successfully',
      project: updatedProject
    })

  } catch (error) {
    console.error('Error updating client email:', error)
    return NextResponse.json(
      { error: 'Failed to update client email' },
      { status: 500 }
    )
  }
}
