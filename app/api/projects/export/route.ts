import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, clients } from "@/db/schema";
import { eq, or, like, desc, and } from "drizzle-orm";

// GET - Export projects as CSV
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // Get all projects (no pagination for export)
    let whereCondition = undefined;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(projects.title, `%${search}%`),
          like(projects.description, `%${search}%`)
        )
      );
    }

    if (status && status !== "all") {
      conditions.push(eq(projects.status, status));
    }

    if (conditions.length > 0) {
      whereCondition =
        conditions.length === 1 ? conditions[0] : and(...conditions);
    }

    const projectsResult = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        downloadEnabled: projects.downloadEnabled,
        emailNotifications: projects.emailNotifications,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        lastActivity: projects.lastActivity,
        clientId: projects.clientId,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        clientEmail: clients.email,
        clientCompany: clients.company,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(whereCondition)
      .orderBy(desc(projects.createdAt));

    // Create CSV content
    const csvHeaders = [
      "Title",
      "Description",
      "Status",
      "Client First Name",
      "Client Last Name",
      "Client Email",
      "Client Company",
      "Download Enabled",
      "Email Notifications",
      "Last Activity",
      "Created At",
      "Last Updated",
    ];

    const csvRows = projectsResult.map((project) => [
      `"${project.title || ""}"`,
      `"${project.description || ""}"`,
      `"${project.status || ""}"`,
      `"${project.clientFirstName || ""}"`,
      `"${project.clientLastName || ""}"`,
      `"${project.clientEmail || ""}"`,
      `"${project.clientCompany || ""}"`,
      project.downloadEnabled ? "Yes" : "No",
      project.emailNotifications ? "Yes" : "No",
      project.lastActivity
        ? new Date(project.lastActivity).toLocaleDateString()
        : "Never",
      new Date(project.createdAt).toLocaleDateString(),
      new Date(project.updatedAt).toLocaleDateString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `projects-export-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to export projects CSV",
      },
      { status: 500 }
    );
  }
}
