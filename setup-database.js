#!/usr/bin/env node

/**
 * Database Setup Script for Client Proofing System
 * 
 * This script uses the centralized database connection from lib/prisma.ts
 * to set up the database with proper configuration.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Client Proofing System Database...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), 'env.example')

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from env.example...')
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env.local created successfully!')
    console.log('⚠️  Please update the DATABASE_URL in .env.local with your actual database connection string')
  } else {
    console.log('❌ env.example not found. Please create .env.local manually.')
    process.exit(1)
  }
} else {
  console.log('✅ .env.local already exists')
}

// Load environment variables
require('dotenv').config({ path: envPath })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.log('❌ DATABASE_URL not found in .env.local')
  console.log('Please set your database URL in .env.local')
  console.log('Format: postgresql://username:password@host:port/database')
  process.exit(1)
}

console.log('🔗 Database URL found:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'))

async function setupDatabase() {
  try {
    console.log('\n🔄 Pushing database schema...')
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database schema pushed successfully!')

    console.log('\n🔄 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated successfully!')

    console.log('\n🔄 Creating default admin user...')
    execSync('node -e "require(\'./lib/prisma.ts\').then(() => console.log(\'✅ Admin user setup completed\'))"', { stdio: 'inherit' })

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Database is now connected using centralized connection')
    console.log('2. Run: npm run dev')
    console.log('3. Visit: https://preview.devnstage.xyz')
    console.log('4. Login with: admin@newstatebranding.com / admin123')
    console.log('5. All tables have been created in your database!')

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure your DATABASE_URL is correct in .env.local')
    console.log('2. Check if your database is accessible')
    console.log('3. Verify your database credentials')
    process.exit(1)
  }
}

setupDatabase()
