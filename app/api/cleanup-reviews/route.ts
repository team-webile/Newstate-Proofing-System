import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // Find all reviews with duplicate shareLinks
    const duplicateShareLinks = await prisma.review.groupBy({
      by: ['shareLink'],
      having: {
        shareLink: {
          _count: {
            gt: 1
          }
        }
      }
    })

    console.log('Found duplicate shareLinks:', duplicateShareLinks)

    // For each duplicate shareLink, keep the first one and update the rest
    for (const duplicate of duplicateShareLinks) {
      const reviews = await prisma.review.findMany({
        where: { shareLink: duplicate.shareLink },
        orderBy: { createdAt: 'asc' }
      })

      // Keep the first review, update the rest with unique shareLinks
      for (let i = 1; i < reviews.length; i++) {
        const uniqueShareLink = `${duplicate.shareLink}-${Date.now()}-${i}`
        await prisma.review.update({
          where: { id: reviews[i].id },
          data: { shareLink: uniqueShareLink }
        })
        console.log(`Updated review ${reviews[i].id} with new shareLink: ${uniqueShareLink}`)
      }
    }

    // Also check for reviews with the same projectId
    const duplicateProjectIds = await prisma.review.groupBy({
      by: ['projectId'],
      having: {
        projectId: {
          _count: {
            gt: 1
          }
        }
      }
    })

    console.log('Found duplicate projectIds:', duplicateProjectIds)

    // For each duplicate projectId, keep the first one and update the rest
    for (const duplicate of duplicateProjectIds) {
      const reviews = await prisma.review.findMany({
        where: { projectId: duplicate.projectId },
        orderBy: { createdAt: 'asc' }
      })

      // Keep the first review, update the rest with unique shareLinks
      for (let i = 1; i < reviews.length; i++) {
        const uniqueShareLink = `review-${duplicate.projectId}-${Date.now()}-${i}`
        await prisma.review.update({
          where: { id: reviews[i].id },
          data: { shareLink: uniqueShareLink }
        })
        console.log(`Updated review ${reviews[i].id} with new shareLink: ${uniqueShareLink}`)
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Reviews cleaned up successfully',
      data: {
        duplicateShareLinks: duplicateShareLinks.length,
        duplicateProjectIds: duplicateProjectIds.length
      }
    })
  } catch (error) {
    console.error('Cleanup reviews error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to cleanup reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
