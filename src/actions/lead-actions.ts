'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createActivity } from './lead-detail'
import { createCalendarEvent } from './calendar'
import { getCurrentUser } from './auth'
import { getInitials } from '@/lib/utils'

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
        let updateData: any = {
            updatedAt: now,
            lastStatusAt: now
        };

        let activityType = '';
        let activityNotes = data.notes || '';

        const leadBase = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!leadBase) return { success: false, error: "Lead not found" };

        const cookieStore = await cookies();
        const session = cookieStore.get('PLATINUM_AUTH_SESSION');
        let ownerId = null;
        if (session) {
            try {
                const sessionData = JSON.parse(session.value);
                ownerId = sessionData.id || null;
                if (!ownerId && sessionData.email) {
                    const userEmail = sessionData.email.toLowerCase().trim();
                    const users: any[] = await prisma.$queryRawUnsafe(
                        `SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
                        userEmail
                    );
                    ownerId = users.length > 0 ? users[0].id : null;
                }
            } catch (e) {}
        }
        
        if (!ownerId) return { success: false, error: "Identità operatore non trovata." };

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
            activityType = 'CANCELLAZIONE';
            activityNotes = `🔴 LEAD CANCELLATO: ${activityNotes}`;
        } else if (type === 'appointment' && data.appointmentDate) {
            updateData.lastStatus = 'APPUNTAMENTO';
            updateData.stage = 'APPUNTAMENTO';
            activityType = 'SYSTEM';
            
            const typeLabel = data.appointmentType === 'showroom' ? "Showroom" : data.appointmentType === 'video' ? "Videochiamata" : "Richiamata";
            activityNotes = `${typeLabel} fissato per il ${data.appointmentDate}. ${activityNotes}`;

            const timezoneOffset = "+02:00"; 
            const startISO = `${data.appointmentDate}:00${timezoneOffset}`;
            const startDate = new Date(startISO);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            
            const finalTitle = data.title || `${typeLabel.toUpperCase()} - ${leadBase.firstName || 'Cliente'}`;

            const app = await prisma.appointment.create({
                data: {
                    title: finalTitle,
                    notes: data.notes || '',
                    location: data.appointmentType === 'showroom' ? "Showroom" : "Remoto",
                    startTime: startDate,
                    duration: 60,
                    leadId: leadId,
                    ownerId: ownerId,
                }
            });

            await createCalendarEvent({
                title: finalTitle,
                description: `Note: ${data.notes || 'nessuna'}`,
                location: data.appointmentType === 'showroom' ? "Showroom" : "Remoto",
                startDateTime: startISO,
                endDateTime: endDate.toISOString(),
                leadId: leadId
            });
        }

        const user = await getCurrentUser();
        const initials = getInitials(user?.name || "??");
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const currentNotes = leadBase?.notesInternal || "";
        const systemNote = `[Sistema - ${initials} - ${timestamp}]: ${activityNotes}\n\n`;

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...updateData,
                notesInternal: systemNote + currentNotes
            }
        });

        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        revalidatePath('/');
        
        return { success: true };
    } catch (error) {
        console.error("Error executing quick action:", error);
        return { success: false, error: String(error) };
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
                stage: 'NUOVO',
            } as any
        });

        await createActivity(lead.id, 'SYSTEM', 'Lead created manually', undefined);
        revalidatePath('/leads');
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

export async function updateLeadDetails(id: string, data: any) {
    try {
        await prisma.lead.update({
            where: { id },
            data: {
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                email: data.email || null,
                phoneRaw: data.phone || null,
                updatedAt: new Date(),
            } as any
        });

        revalidatePath(`/leads/${id}`);
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
