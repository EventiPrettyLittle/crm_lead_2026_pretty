'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

/**
 * Tenta di creare la tabella SystemSettings se non esiste via SQL grezzo
 * per aggirare i problemi di permessi del terminale
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
        console.error("Migration error (might already exist):", e);
    }
}

/**
 * Recupera le impostazioni di sistema dal Database
 */
export async function getSystemSettings() {
    try {
        await ensureTableExists();

        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'global' }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 'global',
                    logoUrl: '',
                    logoWidth: 150
                }
            });
        }

        return serializePrisma(settings);
    } catch (error) {
        console.error("Error fetching settings from DB:", error);
        return { logoUrl: '', logoWidth: 150 };
    }
}

/**
 * Aggiorna le impostazioni di sistema nel Database
 */
export async function updateSystemSettings(data: { logoUrl?: string, logoWidth?: number }) {
    try {
        await ensureTableExists();

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'global' },
            create: {
                id: 'global',
                logoUrl: data.logoUrl || '',
                logoWidth: data.logoWidth || 150
            },
            update: {
                logoUrl: data.logoUrl,
                logoWidth: data.logoWidth
            }
        });

        return { success: true, settings: serializePrisma(settings) };
    } catch (error) {
        console.error("Error updating settings in DB:", error);
        return { success: false, error: "Impossibile salvare nel database" };
    }
}
