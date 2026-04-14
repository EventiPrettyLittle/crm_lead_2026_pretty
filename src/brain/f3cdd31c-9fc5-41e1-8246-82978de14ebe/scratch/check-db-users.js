const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- VERIFICA UTENTI NEL DATABASE ---')
  try {
    const users = await prisma.user.findMany()
    console.log(`Trovati ${users.length} utenti:`)
    users.forEach(u => {
      console.log(`- ${u.email} (Role: ${u.role}, Name: ${u.name})`)
    })
  } catch (e) {
    console.error('ERRORE DATABASE:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
