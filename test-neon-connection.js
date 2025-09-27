#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

console.log('🔍 Testing Neon Database Connection...\n')

async function testConnection() {
  const prisma = new PrismaClient()

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // Test queries
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const projectCount = await prisma.project.count()
    const reviewCount = await prisma.review.count()
    const elementCount = await prisma.element.count()
    const commentCount = await prisma.comment.count()
    const approvalCount = await prisma.approval.count()
    const annotationCount = await prisma.annotation.count()
    const settingsCount = await prisma.settings.count()

    console.log('\n📊 Database Statistics:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Clients: ${clientCount}`)
    console.log(`   Projects: ${projectCount}`)
    console.log(`   Reviews: ${reviewCount}`)
    console.log(`   Elements: ${elementCount}`)
    console.log(`   Comments: ${commentCount}`)
    console.log(`   Approvals: ${approvalCount}`)
    console.log(`   Annotations: ${annotationCount}`)
    console.log(`   Settings: ${settingsCount}`)

    // Test admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (adminUser) {
      console.log('\n👤 Admin User Found:')
      console.log(`   Name: ${adminUser.name}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   Created: ${adminUser.createdAt}`)
    }

    console.log('\n🎉 All tests passed! Neon database is working correctly.')

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
