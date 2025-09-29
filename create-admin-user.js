#!/usr/bin/env node

/**
 * Admin User Creation Script for Client Proofing System
 * 
 * This script uses the centralized database connection from lib/prisma.ts
 * to create the default admin user.
 */

const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

console.log('🔐 Creating admin user using centralized database connection...\n')

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })

async function createAdminUser() {
  try {
    // Import the centralized prisma connection
    const { prisma } = require('./lib/prisma')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Name: ${existingAdmin.name}`)
      console.log(`   Role: ${existingAdmin.role}`)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@newstatebranding.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ Admin user created successfully:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: admin123`)
    console.log(`   Role: ${adminUser.role}`)

    // Create default settings
    const existingSettings = await prisma.settings.findFirst({
      where: { userId: adminUser.id }
    })

    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          userId: adminUser.id,
          approvalMessage: 'Thank you for your approval!',
          signatureMessage: 'By signing below, I approve this design element.',
          companyName: 'New State Branding',
          themeMode: 'system'
        }
      })
      console.log('✅ Default settings created for admin user')
    }

    console.log('\n🎉 Admin user setup completed!')
    console.log('📋 Login credentials:')
    console.log('   Email: admin@newstatebranding.com')
    console.log('   Password: admin123')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  }
}

createAdminUser()
