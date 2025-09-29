#!/usr/bin/env node

/**
 * Database Query Script for Client Proofing System
 * 
 * This script allows you to run SQL queries directly on your Neon database
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

console.log('🔍 Database Query Tool for Neon Database\n')

// Load environment variables
require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

// Create readline interface for interactive queries
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function connectAndShowTables() {
  try {
    await prisma.$connect()
    console.log('✅ Connected to Neon database successfully!')
    
    // Show all tables
    console.log('\n📋 Available Tables:')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`)
    })
    
    console.log('\n💡 You can now run queries. Examples:')
    console.log('   - SELECT * FROM users;')
    console.log('   - SELECT * FROM projects;')
    console.log('   - SELECT * FROM clients;')
    console.log('   - Type "exit" to quit')
    console.log('\n')
    
    promptForQuery()
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }
}

function promptForQuery() {
  rl.question('SQL> ', async (query) => {
    if (query.toLowerCase().trim() === 'exit') {
      console.log('👋 Goodbye!')
      await prisma.$disconnect()
      rl.close()
      return
    }
    
    if (query.trim() === '') {
      promptForQuery()
      return
    }
    
    try {
      const result = await prisma.$queryRawUnsafe(query)
      console.log('\n📊 Result:')
      console.table(result)
      console.log('\n')
    } catch (error) {
      console.error('❌ Query error:', error.message)
    }
    
    promptForQuery()
  })
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Goodbye!')
  await prisma.$disconnect()
  rl.close()
  process.exit(0)
})

connectAndShowTables()
