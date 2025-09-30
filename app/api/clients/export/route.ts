import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { eq, or, like, desc, count } from "drizzle-orm";

// GET - Export clients as CSV
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Get all clients (no pagination for export)
    let whereCondition = undefined;
    if (search) {
      whereCondition = or(
        like(clients.firstName, `%${search}%`),
        like(clients.lastName, `%${search}%`),
        like(clients.email, `%${search}%`),
        like(clients.company, `%${search}%`)
      );
    }

    const clientsResult = await db
      .select()
      .from(clients)
      .where(whereCondition)
      .orderBy(desc(clients.createdAt));

    // Add project count to each client
    const clientsWithCounts = await Promise.all(
      clientsResult.map(async (client) => {
        const [projectCount] = await db
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.clientId, client.id));

        return {
          ...client,
          _count: {
            projects: projectCount?.count || 0,
          },
        };
      })
    );

    // Create CSV content
    const csvHeaders = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Address",
      "Notes",
      "Projects Count",
      "Created At",
      "Last Updated",
    ];

    const csvRows = clientsWithCounts.map((client) => [
      `"${client.firstName || ""}"`,
      `"${client.lastName || ""}"`,
      `"${client.email || ""}"`,
      `"${client.phone || ""}"`,
      `"${client.company || ""}"`,
      `"${client.address || ""}"`,
      `"${client.notes || ""}"`,
      client._count?.projects || 0,
      new Date(client.createdAt).toLocaleDateString(),
      new Date(client.updatedAt).toLocaleDateString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `clients-export-${timestamp}.csv`;

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
        message: "Failed to export clients CSV",
      },
      { status: 500 }
    );
  }
}
