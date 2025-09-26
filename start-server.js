const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Client Proofing System...')

// Start Next.js development server
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
})

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...')
  nextProcess.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...')
  nextProcess.kill('SIGTERM')
  process.exit(0)
})

// Handle errors
nextProcess.on('error', (error) => {
  console.error('❌ Error starting Next.js server:', error)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Next.js server exited with code ${code}`)
    process.exit(code)
  }
})

console.log('✅ Development server started successfully!')
console.log('📡 Socket.io server is integrated with Next.js')
console.log('🌐 Visit: http://localhost:3000')
