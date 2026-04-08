'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

export async function searchLeadsGlobal(query: string) {
    if (!query || query.length < 2) return [];

    try {
        // Pulizia query per ricerca robusta
        const cleanQuery = query.replace(/\s+/g, '').toLowerCase();

        // Recuperiamo i lead (limitiamo per performance)
        const leads = await prisma.lead.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' }
        });

        // Filtraggio lato server con logica "fuzzy" (insensibile a spazi e case)
        const results = leads.filter(lead => {
            const fullName = `${lead.firstName || ''}${lead.lastName || ''}`.toLowerCase().replace(/\s+/g, '');
            const phone = (lead.phoneRaw || '').replace(/\D/g, '');
            const searchPart = cleanQuery.replace(/\D/g, ''); // Per i numeri
            
            const matchesName = fullName.includes(cleanQuery);
            const matchesPhone = searchPart && phone.includes(searchPart);
            
            return matchesName || matchesPhone;
        });

        return serializePrisma(results);
    } catch (error) {
        console.error("Global search error:", error);
        return [];
    }
}
