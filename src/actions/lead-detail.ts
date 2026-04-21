'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

export async function getLeadById(id: string) {
    try {
        // VERSIONE POTENZIATA: Carichiamo tutto quello che serve per la scheda Premium
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                quotes: {
                    orderBy: { createdAt: 'desc' }
                },
                appointments: {
                    orderBy: { startTime: 'asc' }
                }
            }
        });

        if (!lead) return null;

        return serializePrisma(lead);
    } catch (error) {
        console.error("Error fetching lead detail:", error);
        // Fallback estremo se le relazioni crashano (ma dopo il db-init dovrebbero andare)
        const liteLead = await prisma.lead.findUnique({ where: { id } });
        return serializePrisma({ 
            ...liteLead, 
            activities: [], 
            quotes: [], 
            appointments: [] 
        });
    }
}

export async function createActivity(leadId: string, type: string, notes: string, nextFollowupAt?: Date) {
    try {
        const activity = await prisma.activity.create({
            data: {
                leadId,
                type,
                notes,
                nextFollowupAt
            }
        });
        return { success: true, activity };
    } catch (error) {
        console.error("Error creating activity:", error);
        return { success: false };
    }
}
