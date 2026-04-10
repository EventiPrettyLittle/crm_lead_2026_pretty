'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { serializePrisma } from "@/lib/serialize"

export async function getLeadById(id: string) {
    const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
            activities: {
                orderBy: { createdAt: 'desc' }
            },
            quotes: {
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            },
            appointments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (lead) {
        // Recuperiamo anche i preventivi di altri lead che hanno lo stesso nome e cognome
        // per avere uno storico completo del cliente
        const associatedQuotes = await prisma.quote.findMany({
            where: {
                lead: {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    id: { not: lead.id } // Escludiamo quelli già inclusi
                }
            },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });

        // Uniamo i preventivi evitando duplicati se necessario (anche se lead.id è diverso)
        if (associatedQuotes.length > 0) {
            (lead as any).quotes = [...lead.quotes, ...associatedQuotes].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
    }

    return serializePrisma(lead);
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

        // Update lead last interaction if needed
        // This logic is mainly handled by specialized actions (like quick actions), 
        // but generic activity logging might want to touch updatedAt
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
