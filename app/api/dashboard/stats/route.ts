import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { db } from "@/db";
import { clients, projects, reviews } from "@/db/schema";
import { count, eq } from "drizzle-orm";

async function handler(req: NextRequest, user: AuthUser) {
  try {
    if (req.method === "GET") {
      // Get total clients
      const [totalClientsResult] = await db
        .select({ count: count() })
        .from(clients);
      const totalClients = totalClientsResult.count;

      // Get total projects
      const [totalProjectsResult] = await db
        .select({ count: count() })
        .from(projects);
      const totalProjects = totalProjectsResult.count;

      // Get pending projects (projects with pending reviews)
      const [pendingProjectsResult] = await db
        .select({ count: count() })
        .from(projects)
        .innerJoin(reviews, eq(projects.id, reviews.projectId))
        .where(eq(reviews.status, "PENDING"));
      const pendingProjects = pendingProjectsResult.count;

      // Get active projects (projects with in-progress reviews)
      const [activeProjectsResult] = await db
        .select({ count: count() })
        .from(projects)
        .innerJoin(reviews, eq(projects.id, reviews.projectId))
        .where(eq(reviews.status, "IN_PROGRESS"));
      const activeProjects = activeProjectsResult.count;

      const stats = {
        totalClients,
        totalProjects,
        pendingProjects,
        activeProjects,
      };

      return NextResponse.json({
        status: "success",
        message: "Dashboard stats retrieved successfully",
        data: stats,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Method not allowed",
      },
      { status: 405 }
    );
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
