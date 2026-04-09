'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

export async function searchLeadsGlobal(query: string) {
    if (!query || query.length < 2) return [];

    try {
        const trimmedQuery = query.trim();

        // Ricerca potente direttamente nel Database
        // Cerchiamo in contemporanea su più campi con modalità insensibile al maiuscolo/minuscolo
        const results = await prisma.lead.findMany({
            where: {
                OR: [
                    { firstName: { contains: trimmedQuery, mode: 'insensitive' } },
                    { lastName: { contains: trimmedQuery, mode: 'insensitive' } },
                    { phoneRaw: { contains: trimmedQuery.replace(/\s+/g, ''), mode: 'insensitive' } },
                    { email: { contains: trimmedQuery, mode: 'insensitive' } },
                ]
            },
            take: 20, // Ora prendiamo fino a 20 risultati pertinenti
            orderBy: { updatedAt: 'desc' }
        });

        return serializePrisma(results);
    } catch (error) {
        console.error("Global search error:", error);
        return [];
    }
}
