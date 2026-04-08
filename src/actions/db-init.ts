'use server'

import prisma from "@/lib/prisma"

export async function initDatabase() {
    try {
        console.log("Inizializzazione database manuale...");
        
        // Crea tabella Product se non esiste - Usiamo il nome minuscolo per massimizzare la compatibilità
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS public."Product" (
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

        // Sincronizziamo anche User, QuoteItem e Quote
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(65,30);`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "QuoteItem" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(65,30) DEFAULT 0;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "additionalServices" TEXT;`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredContactTime" TEXT;`);
        } catch (e) {}

        // Tabella Payment
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS public."Payment" (
                "id" TEXT PRIMARY KEY,
                "quoteId" TEXT NOT NULL REFERENCES "Quote"(id) ON DELETE CASCADE,
                "amount" DECIMAL(65,30) NOT NULL,
                "method" TEXT,
                "notes" TEXT,
                "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabella Settings
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS public."CompanySettings" (
                "id" TEXT PRIMARY KEY,
                "companyName" TEXT,
                "address" TEXT,
                "vatNumber" TEXT,
                "iban" TEXT,
                "phone" TEXT,
                "email" TEXT,
                "referente" TEXT,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        return { success: true };
    } catch (error: any) {
        console.error("Errore inizializzazione database:", error);
        return { success: false, error: error.message };
    }
}
