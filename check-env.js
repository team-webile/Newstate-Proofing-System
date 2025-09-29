// Environment variables checker
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking environment variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SOCKET_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_BASE_URL',
  'DATABASE_URL',
  'JWT_SECRET'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: Not defined`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 All required environment variables are set!');
} else {
  console.log('⚠️  Some environment variables are missing.');
  console.log('Please check your .env.local file.');
}

console.log('\n📋 Current environment configuration:');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Socket URL: ${process.env.NEXT_PUBLIC_SOCKET_URL || 'Not set'}`);
console.log(`App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
