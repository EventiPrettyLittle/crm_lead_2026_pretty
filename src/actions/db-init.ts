'use server'

import prisma from "@/lib/prisma"

export async function initDatabase() {
    try {
        console.log("Inizializzazione database manuale...");
        
        // Creazione tabelle essenziali se mancano (senza prefisso public forzato per evitare errori di schema)
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Product" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT NOT NULL,
                "description" TEXT,
                "sku" TEXT,
                "price" DECIMAL(65,30) NOT NULL,
                "category" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PresentationItem" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "kind" TEXT,
                "url" TEXT,
                "parentId" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Sincronizziamo colonne mancanti su tabelle esistenti
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(65,30);`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(65,30) DEFAULT 0;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "additionalServices" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredContactTime" TEXT;`);
        } catch (e) {}

        return { success: true };
    } catch (error: any) {
        console.error("Errore inizializzazione database:", error);
        return { success: false, error: error.message };
    }
}
