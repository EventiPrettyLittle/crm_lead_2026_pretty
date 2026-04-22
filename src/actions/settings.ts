'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function getCompanySettings() {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CompanySettings" LIMIT 1`);
        if (results.length > 0) {
            const res = results[0];
            // Mappatura ultra-resiliente per ogni variante di case (lowercase vs camelCase)
            return {
                id: res.id,
                companyName: res.companyname || res.companyName || res.CompanyName || "PRETTY LITTLE SRL",
                address: res.address || res.Address || "Napoli, Italia",
                vatNumber: res.vatnumber || res.vatNumber || res.VatNumber || "Partita IVA in attesa",
                iban: res.iban || res.Iban || res.IBAN || "",
                phone: res.phone || res.Phone || "+39",
                email: res.email || res.Email || "info@prettylittle.it",
                referente: res.referente || res.Referente || "Luca Vitale",
            };
        }
        
        // PARACADUTE: Se il database è vuoto, restituiamo i dati certi di Pretty Little
        return {
            id: 'fallback',
            companyName: "PRETTY LITTLE SRL",
            address: "Napoli, Italia",
            vatNumber: "00000000000",
            iban: "",
            phone: "+39",
            email: "info@prettylittle.it",
            referente: "Luca Vitale"
        };
    } catch (e) {
        // Se la tabella non esiste, fallback
        return {
            id: 'error_fallback',
            companyName: "PRETTY LITTLE SRL",
            address: "Napoli, Italia",
            vatNumber: "00000000000",
            phone: "+39",
            email: "info@prettylittle.it",
            referente: "Luca Vitale"
        };
    }
}

export async function updateCompanySettings(data: any) {
    await initSettingsTable();
    
    const existing = await getCompanySettings();
    if (existing) {
        await prisma.$executeRawUnsafe(
            `UPDATE "CompanySettings" SET 
             "companyName" = $1, "address" = $2, "vatNumber" = $3, 
             "iban" = $4, "phone" = $5, "email" = $6, "referente" = $7, 
             "updatedAt" = CURRENT_TIMESTAMP 
             WHERE id = $8`,
            data.companyName, data.address, data.vatNumber, data.iban, data.phone, data.email, data.referente, existing.id
        );
    } else {
        const id = 'settings_main';
        await prisma.$executeRawUnsafe(
            `INSERT INTO "CompanySettings" (id, "companyName", "address", "vatNumber", "iban", "phone", "email", "referente") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            id, data.companyName, data.address, data.vatNumber, data.iban, data.phone, data.email, data.referente
        );
    }
    revalidatePath('/settings');
    revalidatePath('/quotes');
}

async function initSettingsTable() {
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
    
    // Aggiungiamo anche la colonna createdBy a Quote per tracciare chi lo crea
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;`);
    } catch (e) {}
}
