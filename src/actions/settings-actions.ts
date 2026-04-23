'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

/**
 * Tenta di creare la tabella SystemSettings se non esiste via SQL grezzo
 */
async function ensureTableExists() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "SystemSettings" (
                "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
                "logoUrl" TEXT,
                "logoWidth" INTEGER NOT NULL DEFAULT 150,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        // console.log("Table exists or error");
    }
}

export async function getSystemSettings() {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "SystemSettings" WHERE "id" = 'global' LIMIT 1`);
        let settings = results[0];

        // Se non esistono, le creiamo (opzionale, ma utile per robustezza)
        if (!settings) {
            try {
                await prisma.$executeRawUnsafe(`INSERT INTO "SystemSettings" (id, "logoUrl", "logoWidth") VALUES ('global', '', 150)`);
                settings = { id: 'global', logoUrl: '', logoWidth: 150 };
            } catch (e) {
                // Se fallisce l'insert potrebbe essere che la tabella non esiste, proviamo a crearla
                await ensureTableExists();
                await prisma.$executeRawUnsafe(`INSERT INTO "SystemSettings" (id, "logoUrl", "logoWidth") VALUES ('global', '', 150)`);
                settings = { id: 'global', logoUrl: '', logoWidth: 150 };
            }
        }

        return serializePrisma(settings);
    } catch (error) {
        console.error("Error fetching settings from DB:", error);
        return { logoUrl: '', logoWidth: 150 };
    }
}

/**
 * Aggiorna le impostazioni di sistema nel Database via SQL Raw
 */
export async function updateSystemSettings(data: { logoUrl?: string, logoWidth?: number }) {
    try {
        await ensureTableExists();

        // Upsert manuale via SQL
        const results: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM "SystemSettings" WHERE id = 'global'`);
        
        if (results.length > 0) {
            await prisma.$executeRawUnsafe(
                `UPDATE "SystemSettings" SET "logoUrl" = $1, "logoWidth" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = 'global'`,
                data.logoUrl || '', data.logoWidth || 150
            );
        } else {
            await prisma.$executeRawUnsafe(
                `INSERT INTO "SystemSettings" (id, "logoUrl", "logoWidth") VALUES ('global', $1, $2)`,
                data.logoUrl || '', data.logoWidth || 150
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating settings in DB:", error);
        return { success: false, error: "Impossibile salvare nel database" };
    }
}
