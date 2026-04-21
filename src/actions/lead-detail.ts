'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

export async function getLeadById(id: string) {
    try {
        // RICERCA ULTRA-SEMPLICE SENZA RELAZIONI
        const lead = await prisma.lead.findUnique({
            where: { id }
        });

        if (!lead) return null;

        // Mock delle relazioni per non far crashare la pagina
        const safeLead = {
            ...lead,
            activities: [],
            quotes: [],
            appointments: []
        };

        return serializePrisma(safeLead);
    } catch (error: any) {
        console.error("CRITICAL DATA FETCH ERROR:", error);
        // Restituiamo un oggetto vuoto minimo invece di crashare
        return null;
    }
}
