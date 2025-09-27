#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Neon Database for Client Proofing System...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), 'env.example')

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from env.example...')
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env.local created successfully!')
  } else {
    console.log('❌ env.example not found. Please create .env.local manually.')
    process.exit(1)
  }
} else {
  console.log('✅ .env.local already exists')
}

// Read environment variables
require('dotenv').config({ path: envPath })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env.local')
  console.log('Please set your Neon database URL in .env.local')
  console.log('Format: postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require')
  process.exit(1)
}

console.log('🔗 Database URL found:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'))

async function setupDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    }
  })

  try {
    console.log('\n🔄 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    console.log('\n🔄 Pushing database schema...')
    const { execSync } = require('child_process')
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database schema pushed successfully!')

    console.log('\n🔄 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated successfully!')

    console.log('\n🔄 Creating default admin user...')
    const bcrypt = require('bcryptjs')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@newstatebranding.com',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log('✅ Default admin user created:')
      console.log('   Email: admin@newstatebranding.com')
      console.log('   Password: admin123')
    }

    console.log('\n🔄 Creating default settings...')
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (adminUser) {
      const existingSettings = await prisma.settings.findFirst({
        where: { userId: adminUser.id }
      })

      if (!existingSettings) {
        await prisma.settings.create({
          data: {
            userId: adminUser.id,
            approvalMessage: 'Thank you for your approval!',
            signatureMessage: 'By signing below, I approve this design element.',
            companyName: 'New State Branding'
          }
        })
        console.log('✅ Default settings created')
      } else {
        console.log('✅ Default settings already exist')
      }
    }

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Database is now connected to Neon PostgreSQL')
    console.log('2. Run: npm run dev')
    console.log('3. Visit: http://localhost:3000')
    console.log('4. Login with: admin@newstatebranding.com / admin123')
    console.log('5. All tables have been created in your Neon database!')

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your Neon database URL is correct')
    console.log('2. Check if your Neon database is active')
    console.log('3. Verify your database credentials')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
