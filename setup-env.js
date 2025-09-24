const fs = require('fs');
const path = require('path');

// Create .env.local file
const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/client_proofing"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"

# Upload Directory
UPLOAD_DIR="./uploads"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created successfully!');
  console.log('📝 Please update the DATABASE_URL with your actual database connection string');
  console.log('🔑 Please update the JWT_SECRET with a secure random string');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
}
