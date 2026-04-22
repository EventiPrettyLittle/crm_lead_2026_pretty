'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { serializePrisma } from "@/lib/serialize"

export async function getLeadById(id: string) {
    try {
        // Query ultra-sicura con selezione esplicita dei campi
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                activities: { orderBy: { createdAt: 'desc' } },
                quotes: { include: { items: true }, orderBy: { createdAt: 'desc' } },
                appointments: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!lead) return null;

        // 1. Storico Preventivi Associati
        try {
            const associatedQuotes = await prisma.quote.findMany({
                where: {
                    lead: {
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        id: { not: lead.id }
                    }
                },
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            });

            if (associatedQuotes.length > 0) {
                (lead as any).quotes = [...(lead.quotes || []), ...associatedQuotes].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            }
        } catch (e) {}

        // 2. Storico Pagamenti (SQL Raw per massima stabilità)
        let payments: any[] = [];
        try {
            payments = await prisma.$queryRawUnsafe(
                `SELECT * FROM "Payment" WHERE "leadId" = $1 OR "quoteId" IN (SELECT id FROM "Quote" WHERE "leadId" = $1) ORDER BY date DESC`,
                id
            );
        } catch (e) {
            payments = [];
        }
        (lead as any).payments = payments || [];

        return serializePrisma(lead);
    } catch (error: any) {
        console.error("LEAD FETCH CRASH:", error.message);
        // Fallback estremo se prisma crasha: proviamo SQL Raw per il lead base
        try {
            const rawLeads: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Lead" WHERE id = $1`, id);
            if (rawLeads.length > 0) {
                const rawLead = rawLeads[0];
                rawLead.activities = [];
                rawLead.quotes = [];
                rawLead.appointments = [];
                rawLead.payments = [];
                return serializePrisma(rawLead);
            }
        } catch (innerError) {}
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
