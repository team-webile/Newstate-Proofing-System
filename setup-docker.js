const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🐳 Setting up Docker database for Client Proofing System...\n')

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env')
const envContent = `# Database
DATABASE_URL="mysql://appuser:apppassword@localhost:3306/client_proofing"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Email Configuration (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@newstatebranding.com"

# App Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Domain
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...')
  fs.writeFileSync(envPath, envContent)
  console.log('✅ .env file created successfully!\n')
} else {
  console.log('✅ .env file already exists\n')
}

try {
  // Start Docker containers
  console.log('🚀 Starting Docker containers...')
  try {
    execSync('docker compose up -d', { stdio: 'inherit' })
  } catch (error) {
    // Fallback to docker-compose if docker compose fails
    execSync('docker-compose up -d', { stdio: 'inherit' })
  }
  console.log('✅ Docker containers started successfully!\n')

  // Wait a moment for MySQL to be ready
  console.log('⏳ Waiting for MySQL to be ready...')
  execSync('sleep 10', { stdio: 'inherit' })

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

  console.log('🎉 Setup complete! Your services are running:')
  console.log('')
  console.log('📱 Application: http://localhost:3000')
  console.log('🗄️  phpMyAdmin: http://localhost:8080')
  console.log('')
  console.log('Login credentials:')
  console.log('  Email: admin@newstatebranding.com')
  console.log('  Password: admin123')
  console.log('')
  console.log('Database credentials:')
  console.log('  Host: localhost:3306')
  console.log('  Database: client_proofing')
  console.log('  Username: appuser')
  console.log('  Password: apppassword')
  console.log('')
  console.log('To stop the database: docker compose down')
  console.log('To view logs: docker compose logs -f')

} catch (error) {
  console.error('❌ Setup failed:', error.message)
  console.log('\nTroubleshooting:')
  console.log('1. Make sure Docker is installed and running')
  console.log('2. Check if ports 3306 and 8080 are available')
  console.log('3. Try running: docker-compose down && docker-compose up -d')
  process.exit(1)
}
