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
            updateData.stage = 'NON_RISPONDE';
            activityType = 'RICHIAMO';
            activityNotes = `Non risponde. Reminder ricontatto impostato. ${activityNotes}`;
        } else if (type === 'schedule') {
            updateData.lastStatus = 'DA_RICONTATTARE';
            updateData.nextFollowupAt = data.nextFollowup;
            updateData.stage = 'DA_RICONTATTARE'; // Changed from APPUNTAMENTO to match requested filters
            activityType = 'NOTE';
            activityNotes = `Appuntamento fissato/Pianificato. ${activityNotes}`;
        } else if (type === 'cancelled') {
            updateData.lastStatus = 'CANCELLATO';
            updateData.stage = 'PERSO'; // Changed to PERSO to match requested filters
            activityType = 'NOTE';
            activityNotes = `Lead cancellato/Perso. ${activityNotes}`;
        }

        // Update Lead
        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...updateData,
            }
        });

        // Create Activity
        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        // Sync to Internal Notes box (Top)
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const currentNotes = lead.notesInternal || "";
        const systemNote = `[Sistema - ${timestamp}]: ${activityNotes}\n\n`;
        await prisma.lead.update({
            where: { id: leadId },
            data: { notesInternal: systemNote + currentNotes }
        });

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
        // Self-healing: ensure columns exist
        try {
            await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredContactTime" TEXT;`);
            await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "additionalServices" TEXT;`);
        } catch (e) {}

        const leadId = `cl${Math.random().toString(36).substring(2, 11)}`;
        let eventDate = null;
        if (data.eventDate && data.eventDate.trim() !== "") {
            try {
                eventDate = new Date(data.eventDate);
            } catch (e) {}
        }

        await (prisma as any).$executeRaw`
            INSERT INTO "Lead" (
                "id", "firstName", "lastName", "email", "phoneRaw", 
                "eventType", "eventDate", "eventLocation", "guestsCount", 
                "productInterest", "preferredContactTime", "additionalServices", 
                "stage", "updatedAt", "createdAt"
            ) VALUES (
                ${leadId}, ${data.firstName || null}, ${data.lastName || null}, ${data.email || null}, ${data.phone || null},
                ${data.eventType || null}, ${eventDate}, ${data.eventLocation || null}, ${data.guestsCount ? data.guestsCount.toString() : null},
                ${data.productInterest || null}, ${data.preferredContactTime || null}, ${data.additionalServices || null},
                'NUOVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        `;

        await createActivity(leadId, 'SYSTEM', 'Lead created manually', undefined);

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
    console.log("SERVER: Received Geodata for update:", { city: data.eventCity, prov: data.eventProvince, reg: data.eventRegion });
    try {
        // Self-healing: ensure columns exist
        try {
            await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "preferredContactTime" TEXT;`);
            await (prisma as any).$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "additionalServices" TEXT;`);
        } catch (e) {}

        await (prisma as any).$executeRawUnsafe(`
            UPDATE "Lead" 
            SET "eventCity" = $1, "eventProvince" = $2, "eventRegion" = $3, "eventLocation" = $4, "locationName" = $5,
                "firstName" = $6, "lastName" = $7, "email" = $8, "phoneRaw" = $9, 
                "eventType" = $10, "eventDate" = $11, "guestsCount" = $12, "productInterest" = $13,
                "additionalServices" = $14, "preferredContactTime" = $15,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "id" = $16
        `, 
        data.eventCity || null, data.eventProvince || null, data.eventRegion || null, data.eventLocation || null, data.locationName || null,
        data.firstName || null, data.lastName || null, data.email || null, data.phone || null, 
        data.eventType || null, data.eventDate ? new Date(data.eventDate) : null, 
        data.guestsCount ? data.guestsCount.toString() : null, data.productInterest || null, 
        data.additionalServices || null, data.preferredContactTime || null, id);


        revalidatePath(`/leads/${id}`);
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) {
        console.error("SERVER ERROR: Failed to update lead details:", error);
        return { success: false, error: error.message || "Unknown Prisma Error" };
    }
}
