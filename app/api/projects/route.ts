import { NextResponse } from "next/server"
import { createProject, getProjects, searchProjects, createActivityLog } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get("archived") === "true"
    const query = searchParams.get("q")

    if (query) {
      const projects = await searchProjects(query)
      return NextResponse.json(projects)
    }

    const projects = await getProjects(archived)
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const project = await createProject(data)
    
    // Log activity
    await createActivityLog({
      projectId: project.id,
      userName: "Admin",
      action: "PROJECT_CREATED",
      details: `Created project ${project.projectNumber}`,
    })
    
    console.log("Project created:", project)
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
