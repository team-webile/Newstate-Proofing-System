import { NextResponse } from "next/server"
import { getProjectById, updateProject, createActivityLog, prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const data = await request.json()
    const updatedProject = await updateProject(projectId, data)
    
    // Log activity
    await createActivityLog({
      projectId: projectId,
      userName: "Admin",
      action: "PROJECT_UPDATED",
      details: `Updated project ${updatedProject.projectNumber}`,
    })
    
    console.log("Project updated:", updatedProject)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const data = await request.json()
    const updatedProject = await updateProject(projectId, data)
    
    // Log activity
    await createActivityLog({
      projectId: projectId,
      userName: "Admin",
      action: "PROJECT_UPDATED",
      details: `Updated project ${updatedProject.projectNumber}`,
    })
    
    console.log("Project updated:", updatedProject)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    // First, get the project to log the deletion
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Log the deletion activity BEFORE deleting the project
    await createActivityLog({
      projectId: projectId,
      userName: "Admin",
      action: "PROJECT_DELETED",
      details: `Deleted project ${project.projectNumber} and all associated data`,
    })

    // Delete the project and all associated data using cascade
    // The database schema has CASCADE delete for related tables
    await prisma.project.delete({
      where: { id: projectId }
    })
    
    console.log("Project deleted:", project.projectNumber)
    return NextResponse.json({ 
      success: true, 
      message: "Project and all associated data deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
