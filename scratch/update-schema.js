const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Inizio migrazione schema...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "phone" TEXT;`);
        console.log("Colonna 'phone' aggiunta con successo a 'TeamMember'.");
        
        await prisma.$executeRawUnsafe(`ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "appuntamentoSede" TEXT;`);
        console.log("Colonna 'appuntamentoSede' aggiunta con successo a 'Deal'.");
    } catch(e) {
        console.error("Errore durante la migrazione del DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
