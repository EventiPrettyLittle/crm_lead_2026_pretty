import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Adding password column to User table...")
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
    `)
    console.log("Column added successfully.")
  } catch (e) {
    console.error("Error adding column:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
