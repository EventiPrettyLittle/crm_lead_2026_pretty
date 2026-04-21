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
        let activityType = '';
        let activityNotes = data.notes || '';
        
        // DETERMINIAMO LO STAGE (L'ETICHETTA) IN MODO ASSOLUTO
        const stageMap: Record<string, string> = {
            'contacted': 'CONTATTATO',
            'no-answer': 'NON_RISPONDE',
            'preventivo': 'PREVENTIVO',
            'cancelled': 'CANCELLATO',
            'appointment': 'APPUNTAMENTO'
        };
        const newStage = stageMap[type];

        let updateData: any = {
            updatedAt: now,
            lastStatusAt: now,
            stage: newStage,      // AGGIORNIAMO SEMPRE LO STAGE (ETICHETTA)
            lastStatus: newStage  // E ANCHE IL LAST STATUS PER SICUREZZA
        };

        const leadBase = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!leadBase) return { success: false, error: "Lead non trovato" };

        const cookieStore = await cookies();
        const session = cookieStore.get('PLATINUM_AUTH_SESSION');
        let ownerId = null;
        if (session) {
            try {
                const sessionData = JSON.parse(session.value);
                ownerId = sessionData.id || null;
            } catch (e) {}
        }
        
        if (!ownerId) return { success: false, error: "Identità operatore non trovata." };

        if (type === 'contacted') {
            updateData.contactedAt = now;
            activityType = 'CALL';
        } else if (type === 'no-answer') {
            updateData.nextFollowupAt = data.nextFollowup;
            activityType = 'RICHIAMO';
        } else if (type === 'appointment') {
            activityType = 'SYSTEM';
            // Logica appuntamento...
            const typeLabel = data.appointmentType === 'showroom' ? "Showroom" : "Remoto";
            const startISO = `${data.appointmentDate}:00+02:00`;
            const startDate = new Date(startISO);
            
            await prisma.appointment.create({
                data: {
                    title: data.title || `APPUNTAMENTO - ${leadBase.firstName}`,
                    notes: data.notes || '',
                    location: typeLabel,
                    startTime: startDate,
                    duration: 60,
                    leadId: leadId,
                    ownerId: ownerId,
                }
            });
        }

        const user = await getCurrentUser();
        const initials = getInitials(user?.name || "??");
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const systemNote = `[Sistema - ${initials} - ${timestamp}]: Stato -> ${newStage}. Note: ${activityNotes}\n\n`;

        // AGGIORNAMENTO DB
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...updateData,
                notesInternal: systemNote + (leadBase.notesInternal || "")
            }
        });

        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        // REVALIDAZIONE MASSICCIA
        revalidatePath(`/leads/${leadId}`, 'page');
        revalidatePath('/leads', 'page');
        revalidatePath('/', 'page');
        
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
        revalidatePath('/leads');
        return { success: true };
    } catch (error) {
        return { success: false };
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
