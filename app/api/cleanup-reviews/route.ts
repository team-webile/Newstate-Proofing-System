import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  clients,
  users,
  reviews,
  elements,
  comments,
  approvals,
  settings,
} from "@/db/schema";
import { eq, and, or, like, desc, asc, count } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Find all reviews with duplicate shareLinks using Drizzle
    const allReviews = await db
      .select({
        id: reviews.id,
        shareLink: reviews.shareLink,
        projectId: reviews.projectId,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .orderBy(asc(reviews.createdAt));

    // Group by shareLink to find duplicates
    const shareLinkGroups = new Map();
    const projectIdGroups = new Map();

    allReviews.forEach((review) => {
      // Group by shareLink
      if (!shareLinkGroups.has(review.shareLink)) {
        shareLinkGroups.set(review.shareLink, []);
      }
      shareLinkGroups.get(review.shareLink).push(review);

      // Group by projectId
      if (!projectIdGroups.has(review.projectId)) {
        projectIdGroups.set(review.projectId, []);
      }
      projectIdGroups.get(review.projectId).push(review);
    });

    // Process duplicate shareLinks
    let duplicateShareLinksCount = 0;
    for (const [shareLink, reviewsList] of shareLinkGroups) {
      if (reviewsList.length > 1) {
        duplicateShareLinksCount += reviewsList.length - 1;
        // Keep the first review, update the rest with unique shareLinks
        for (let i = 1; i < reviewsList.length; i++) {
          const uniqueShareLink = `${shareLink}-${Date.now()}-${i}`;
          await db
            .update(reviews)
            .set({ shareLink: uniqueShareLink })
            .where(eq(reviews.id, reviewsList[i].id));
          console.log(
            `Updated review ${reviewsList[i].id} with new shareLink: ${uniqueShareLink}`
          );
        }
      }
    }

    // Process duplicate projectIds
    let duplicateProjectIdsCount = 0;
    for (const [projectId, reviewsList] of projectIdGroups) {
      if (reviewsList.length > 1) {
        duplicateProjectIdsCount += reviewsList.length - 1;
        // Keep the first review, update the rest with unique shareLinks
        for (let i = 1; i < reviewsList.length; i++) {
          const uniqueShareLink = `review-${projectId}-${Date.now()}-${i}`;
          await db
            .update(reviews)
            .set({ shareLink: uniqueShareLink })
            .where(eq(reviews.id, reviewsList[i].id));
          console.log(
            `Updated review ${reviewsList[i].id} with new shareLink: ${uniqueShareLink}`
          );
        }
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Reviews cleaned up successfully",
      data: {
        duplicateShareLinks: duplicateShareLinksCount,
        duplicateProjectIds: duplicateProjectIdsCount,
      },
    });
  } catch (error) {
    console.error("Cleanup reviews error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to cleanup reviews",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
