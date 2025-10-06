import { NextResponse } from "next/server"
import { getActivityLogs } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (projectId) {
      const logs = await getActivityLogs(parseInt(projectId))
      return NextResponse.json(logs)
    }

    const logs = await getActivityLogs()
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}

