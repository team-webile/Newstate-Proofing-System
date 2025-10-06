import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user only
  const hashedPassword = await bcrypt.hash('AdminPass123!', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@proofing-system.com' },
    update: {
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    },
    create: {
      email: 'admin@proofing-system.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      password: hashedPassword,
    },
  })

  console.log('✅ Admin user created:', { email: adminUser.email, role: adminUser.role })
  console.log('🔑 Admin login credentials:')
  console.log('   Email: admin@proofing-system.com')
  console.log('   Password: AdminPass123!')
  console.log('🎉 Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
