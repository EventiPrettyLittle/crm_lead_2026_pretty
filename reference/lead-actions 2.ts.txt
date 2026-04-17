'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { createActivity } from './lead-detail'

export async function updateLeadQuickAction(
    leadId: string,
    type: 'contacted' | 'no-answer' | 'schedule' | 'cancelled',
    data: {
        notes?: string;
        nextFollowup?: Date;
    }
) {
    try {
        const now = new Date();
        let updateData: any = {
            updatedAt: now,
            lastStatusAt: now
        };

        let activityType = '';
        let activityNotes = data.notes || '';

        if (type === 'contacted') {
            updateData.lastStatus = 'CONTATTATO';
            updateData.contactedAt = now;
            updateData.stage = 'CONTATTATO';
            activityType = 'CALL';
            activityNotes = `Segnato come contattato. ${activityNotes}`;
        } else if (type === 'no-answer') {
            updateData.lastStatus = 'NON_RISPONDE';
            updateData.nextFollowupAt = data.nextFollowup;
            updateData.stage = 'FOLLOWUP';
            activityType = 'RICHIAMO';
            activityNotes = `Non risponde. Richiamo pianificato. ${activityNotes}`;
        } else if (type === 'schedule') {
            updateData.lastStatus = 'DA_RICONTATTARE';
            updateData.nextFollowupAt = data.nextFollowup;
            updateData.stage = 'APPUNTAMENTO';
            activityType = 'NOTE';
            activityNotes = `Appuntamento fissato/Pianificato. ${activityNotes}`;
        } else if (type === 'cancelled') {
            updateData.lastStatus = 'CANCELLATO';
            updateData.stage = 'PERSO';
            activityType = 'NOTE';
            activityNotes = `Lead cancellato/Perso. ${activityNotes}`;
        }

        // Update Lead
        await prisma.lead.update({
            where: { id: leadId },
            data: updateData
        });

        // Create Activity
        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        revalidatePath('/kanban');
        revalidatePath('/activities');
        return { success: true };
    } catch (error) {
        console.error("Error executing quick action:", error);
        return { success: false, error };
    }
}

export async function createManualLead(data: any) {
    try {
        const lead = await prisma.lead.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneRaw: data.phone,
                eventType: data.eventType,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                eventLocation: data.eventLocation,
                guestsCount: data.guestsCount ? parseInt(data.guestsCount) : null,
                productInterest: data.productInterest,
                stage: 'NUOVO',
            }
        });

        await createActivity(lead.id, 'SYSTEM', 'Lead created manually', undefined);

        revalidatePath('/leads');
        return { success: true, lead };
    } catch (error) {
        console.error("Error creating manual lead:", error);
        return { success: false, error };
    }
}

export async function deleteAllLeads() {
    try {
        await prisma.activity.deleteMany({});
        await prisma.quoteItem.deleteMany({});
        await prisma.quote.deleteMany({});
        await prisma.appointment.deleteMany({});
        await prisma.lead.deleteMany({});

        revalidatePath('/leads');
        revalidatePath('/kanban');
        revalidatePath('/activities');
        return { success: true };
    } catch (error) {
        console.error("Error deleting leads:", error);
        return { success: false, error };
    }
}
