'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"
import { revalidatePath } from 'next/cache'

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
        return null;
    }
}

export async function createActivity(leadId: string, type: string, notes?: string, nextFollowupAt?: Date) {
    try {
        await prisma.activity.create({
            data: {
                leadId,
                type,
                notes,
                nextFollowupAt
            }
        });

        await prisma.lead.update({
            where: { id: leadId },
            data: { updatedAt: new Date() }
        });

        revalidatePath(`/leads/${leadId}`);
        return { success: true };
    } catch (error) {
        console.error("Error creating activity:", error);
        return { success: false, error };
    }
}
