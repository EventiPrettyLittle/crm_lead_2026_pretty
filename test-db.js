const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(65,30);`);
        console.log("originalPrice done");
        await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(65,30) DEFAULT 0;`);
        console.log("discount done");
    } catch(e) {
        console.log("Error:", e);
    }
    prisma.$disconnect();
}
main();
