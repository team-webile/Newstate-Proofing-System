import jsPDF from 'jspdf'
import { Project } from '@/types'

interface ProjectForPDF {
  id: string
  clientName: string
  clientEmail: string
  description?: string
  status: string
  downloadEnabled: boolean
  createdAt: string
  updatedAt: string
  _count: {
    reviews: number
    approvals: number
  }
}

export const generateProjectPDF = (project: ProjectForPDF) => {
  const doc = new jsPDF()
  
  // Set up colors
  const primaryColor = '#1f2937' // gray-800
  const secondaryColor = '#6b7280' // gray-500
  const accentColor = '#3b82f6' // blue-500
  
  // Title
  doc.setFontSize(24)
  doc.setTextColor(primaryColor)
  doc.text('Project Report', 20, 30)
  
  // Project ID
  doc.setFontSize(10)
  doc.setTextColor(secondaryColor)
  doc.text(`Project ID: ${project.id}`, 20, 40)
  
  // Line separator
  doc.setDrawColor(accentColor)
  doc.setLineWidth(0.5)
  doc.line(20, 45, 190, 45)
  
  // Client Information
  doc.setFontSize(16)
  doc.setTextColor(primaryColor)
  doc.text('Client Information', 20, 60)
  
  doc.setFontSize(12)
  doc.setTextColor(secondaryColor)
  doc.text(`Client Name: ${project.clientName}`, 20, 75)
  doc.text(`Email: ${project.clientEmail}`, 20, 85)
  
  if (project.description) {
    doc.text('Description:', 20, 95)
    doc.setFontSize(10)
    const descriptionLines = doc.splitTextToSize(project.description, 170)
    doc.text(descriptionLines, 20, 105)
  }
  
  // Project Details
  const detailsY = project.description ? 125 : 105
  doc.setFontSize(16)
  doc.setTextColor(primaryColor)
  doc.text('Project Details', 20, detailsY)
  
  doc.setFontSize(12)
  doc.setTextColor(secondaryColor)
  doc.text(`Status: ${project.status}`, 20, detailsY + 15)
  doc.text(`Download Enabled: ${project.downloadEnabled ? 'Yes' : 'No'}`, 20, detailsY + 25)
  doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, 20, detailsY + 35)
  doc.text(`Last Updated: ${new Date(project.updatedAt).toLocaleDateString()}`, 20, detailsY + 45)
  
  // Statistics
  const statsY = detailsY + 65
  doc.setFontSize(16)
  doc.setTextColor(primaryColor)
  doc.text('Statistics', 20, statsY)
  
  doc.setFontSize(12)
  doc.setTextColor(secondaryColor)
  doc.text(`Total Reviews: ${project._count.reviews}`, 20, statsY + 15)
  doc.text(`Total Approvals: ${project._count.approvals}`, 20, statsY + 25)
  
  // Footer
  const footerY = 280
  doc.setFontSize(8)
  doc.setTextColor(secondaryColor)
  doc.text('Generated on ' + new Date().toLocaleString(), 20, footerY)
  doc.text('New State Branding - Client Proofing System', 20, footerY + 10)
  
  return doc
}

export const downloadProjectPDF = (project: ProjectForPDF) => {
  const doc = generateProjectPDF(project)
  const fileName = `project-${project.clientName.replace(/\s+/g, '-').toLowerCase()}-${project.id.slice(-8)}.pdf`
  doc.save(fileName)
}
