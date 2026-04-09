'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { createActivity } from './lead-detail'
import { createCalendarEvent } from './calendar'

export async function updateLeadQuickAction(
    leadId: string,
    type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment',
    data: {
        notes?: string;
        nextFollowup?: Date;
        appointmentDate?: string;
        appointmentType?: string;
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

        // Recuperiamo il lead per avere il nome nel titolo del calendario
        const leadBase = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!leadBase) return { success: false, error: "Lead not found" };

        if (type === 'contacted') {
            updateData.lastStatus = 'CONTATTATO';
            updateData.contactedAt = now;
            updateData.stage = 'CONTATTATO';
            activityType = 'CALL';
            activityNotes = `Segnato come contattato. ${activityNotes}`;
        } else if (type === 'no-answer') {
            updateData.lastStatus = 'NON_RISPONDE';
            updateData.nextFollowupAt = data.nextFollowup;
            updateData.stage = 'NON_RISPONDE';
            activityType = 'RICHIAMO';
            activityNotes = `Non risponde. ${activityNotes}`;
        } else if (type === 'preventivo') {
            updateData.lastStatus = 'PREVENTIVO';
            updateData.stage = 'PREVENTIVO';
            activityType = 'QUOTE';
            activityNotes = `Passato a stato Preventivo. ${activityNotes}`;
        } else if (type === 'cancelled') {
            updateData.lastStatus = 'CANCELLATO';
            updateData.stage = 'CANCELLATO';
            activityType = 'NOTE';
            activityNotes = `Lead segnato come Cancellato. ${activityNotes}`;
        } else if (type === 'appointment' && data.appointmentDate) {
            updateData.lastStatus = 'APPUNTAMENTO';
            updateData.stage = 'APPUNTAMENTO';
            activityType = 'SYSTEM';
            const typeLabel = data.appointmentType === 'showroom' ? "In Showroom" : "Richiamata";
            activityNotes = `Appuntamento [${typeLabel}] fissato per il ${data.appointmentDate}. ${activityNotes}`;

            // CREAZIONE EVENTO CALENDARIO (Google + Locale)
            const startStr = data.appointmentDate; // Formato YYYY-MM-DDTHH:mm
            const startDate = new Date(startStr);
            const endDate = new Date(startDate.getTime() + 60 * 60000); // Default 1 ora

            await createCalendarEvent({
                title: `${typeLabel}: ${leadBase.firstName} ${leadBase.lastName}`,
                description: `Appuntamento CRM per lead ${leadBase.firstName}. Note: ${data.notes || ''}`,
                location: data.appointmentType === 'showroom' ? "Showroom" : "Telefono",
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
                leadId: leadId
            });
        }

        // Update Lead
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...updateData,
            }
        });

        // Create Activity
        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        // Sync to Internal Notes box (Top)
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const currentNotes = updatedLead.notesInternal || "";
        const systemNote = `[Sistema - ${timestamp}]: ${activityNotes}\n\n`;
        await prisma.lead.update({
            where: { id: leadId },
            data: { notesInternal: systemNote + currentNotes }
        });

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        revalidatePath('/kanban');
        revalidatePath('/activities');
        revalidatePath('/calendar');
        
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
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                email: data.email || null,
                phoneRaw: data.phone || null,
                eventType: data.eventType || null,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                eventLocation: data.eventLocation || null,
                guestsCount: data.guestsCount ? data.guestsCount.toString() : null,
                productInterest: data.productInterest || null,
                preferredContactTime: data.preferredContactTime || null,
                additionalServices: data.additionalServices || null,
                stage: 'NUOVO',
            } as any
        });

        await createActivity(lead.id, 'SYSTEM', 'Lead created manually', undefined);
        revalidatePath('/leads');
        return { success: true };
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
export async function updateLeadDetails(id: string, data: any) {
    try {
        await prisma.lead.update({
            where: { id },
            data: {
                eventCity: data.eventCity || null,
                eventProvince: data.eventProvince || null,
                eventRegion: data.eventRegion || null,
                eventLocation: data.eventLocation || null,
                locationName: data.locationName || null,
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                email: data.email || null,
                phoneRaw: data.phone || null,
                eventType: data.eventType || null,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                guestsCount: data.guestsCount ? data.guestsCount.toString() : null,
                productInterest: data.productInterest || null,
                additionalServices: data.additionalServices || null,
                preferredContactTime: data.preferredContactTime || null,
                updatedAt: new Date(),
            } as any
        });

        revalidatePath(`/leads/${id}`);
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) {
        console.error("SERVER ERROR: Failed to update lead details:", error);
        return { success: false, error: error.message || "Unknown Prisma Error" };
    }
}
