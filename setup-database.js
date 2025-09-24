const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Client Proofing System Database...\n')

// Check if .env file exists
const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!')
  console.log('Please copy env.example to .env and configure your database connection.')
  console.log('Example: cp env.example .env')
  process.exit(1)
}

try {
  // Push database schema
  console.log('📊 Pushing database schema...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ Database schema pushed successfully!\n')

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated successfully!\n')

  // Create dummy data
  console.log('🎭 Creating dummy data...')
  execSync('node create-dummy-data.js', { stdio: 'inherit' })
  console.log('✅ Dummy data created successfully!\n')

  console.log('🎉 Setup complete! You can now run:')
  console.log('  npm run dev')
  console.log('\nThen visit: http://localhost:3000')
  console.log('\nLogin with:')
  console.log('  Email: admin@newstatebranding.com')
  console.log('  Password: admin123')

} catch (error) {
  console.error('❌ Setup failed:', error.message)
  process.exit(1)
}
