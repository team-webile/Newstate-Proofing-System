const fs = require('fs');
const path = require('path');

// Environment variables needed for the application
const envContent = `# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# Database URL (if using external database)
# DATABASE_URL="file:./dev.db"

# Next.js Environment
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-12345
`;

const envPath = path.join(__dirname, '.env.local');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local already exists');
  } else {
    // Create .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with default environment variables');
    console.log('⚠️  Please update JWT_SECRET and NEXTAUTH_SECRET with your own secure values');
  }
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('\n📝 Please manually create a .env.local file with the following content:');
  console.log(envContent);
}