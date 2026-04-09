'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

/**
 * Recupera le impostazioni di sistema dal Database
 */
export async function getSystemSettings() {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'global' }
        });

        // Se non esistono, le creiamo con i valori di default
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
