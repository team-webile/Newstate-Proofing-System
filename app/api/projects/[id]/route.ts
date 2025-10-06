import { NextResponse } from "next/server"
import { getProjectById, updateProject, createActivityLog } from "@/lib/db"

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
