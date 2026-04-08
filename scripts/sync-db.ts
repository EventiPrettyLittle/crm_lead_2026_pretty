import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Running database sync...')
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "additionalServices" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredContactTime" TEXT;`)
    console.log('Database synced successfully!')
  } catch (error) {
    console.error('Error syncing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
