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
