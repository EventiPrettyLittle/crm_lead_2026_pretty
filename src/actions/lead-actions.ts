'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function updateLeadQuickAction(
    leadId: string,
    type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment',
    data: {
        notes?: string;
        nextFollowup?: Date;
        appointmentDate?: string;
        appointmentType?: string;
        title?: string;
    }
) {
    try {
        const now = new Date();
        const stageMap: Record<string, string> = {
            'contacted': 'CONTATTATO',
            'no-answer': 'NON_RISPONDE',
            'preventivo': 'PREVENTIVO',
            'cancelled': 'CANCELLATO',
            'appointment': 'APPUNTAMENTO'
        };
        const newStage = stageMap[type];

        // 1. UPDATE STATO + ULTIMO CONTATTO (RICHIESTO DA LUCA)
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: newStage,
                lastStatus: newStage,
                lastStatusAt: now,
                contactedAt: now, // Ogni azione rapida è un contatto avvenuto!
                updatedAt: now
            }
        });

        // 2. CREAZIONE ATTIVITÁ (TIMELINE)
        const activityType = type === 'contacted' ? 'CALL' : type === 'no-answer' ? 'RICHIAMO' : 'SYSTEM';
        await prisma.activity.create({
            data: {
                leadId,
                type: activityType,
                notes: `Stato cambiato in ${newStage}. ${data.notes || ''}`,
                nextFollowupAt: data.nextFollowup
            }
        });

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        revalidatePath('/');
        
        return { success: true };
    } catch (error: any) {
        console.error("Critical Global Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createManualLead(data: any) {
    try {
        await prisma.lead.create({
            data: {
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                email: data.email || null,
                phoneRaw: data.phone || null,
                stage: 'NUOVO',
            } as any
        });
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateLeadDetails(id: string, data: any) {
    try {
        const updateData: any = { ...data, updatedAt: new Date() };
        
        // Pulizia undefined per evitare sovrascrizioni involontarie
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });

        await prisma.lead.update({
            where: { id },
            data: updateData
        });
        revalidatePath(`/leads/${id}`);
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}
