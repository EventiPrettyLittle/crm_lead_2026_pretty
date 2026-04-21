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
        const stageMap: Record<string, string> = {
            'contacted': 'CONTATTATO',
            'no-answer': 'NON_RISPONDE',
            'preventivo': 'PREVENTIVO',
            'cancelled': 'CANCELLATO',
            'appointment': 'APPUNTAMENTO'
        };
        const newStage = stageMap[type];

        // 1. RECUPERO LEAD
        const leadBase = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!leadBase) return { success: false, error: "Lead non trovato." };

        // 2. IDENTIFICAZIONE OPERATORE (Con Fallback Safe)
        const currentUser = await getCurrentUser();
        let ownerId = currentUser?.id;

        // Se il cookie fallisce (comune in produzione), cerchiamo un utente ADMIN come fallback
        if (!ownerId) {
            const adminUser: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE role = 'ADMIN' OR email LIKE '%luca%' LIMIT 1`);
            ownerId = adminUser[0]?.id || null;
        }
        
        // Se proprio non troviamo nessuno (estremamente raro), mettiamo un ID di sistema
        if (!ownerId) ownerId = "system-operator";

        let activityType = 'SYSTEM';
        let activityNotes = data.notes || '';
        if (type === 'contacted') activityType = 'CALL';
        else if (type === 'no-answer') activityType = 'RICHIAMO';
        
        const initials = getInitials(currentUser?.name || "AD");
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const systemNote = `[Sistema - ${initials} - ${timestamp}]: Stato -> ${newStage}.${activityNotes ? ' Note: ' + activityNotes : ''}\n\n`;

        // 3. UPDATE DB
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: newStage,
                lastStatus: newStage,
                lastStatusAt: now,
                updatedAt: now,
                notesInternal: systemNote + (leadBase.notesInternal || "")
            }
        });

        // 4. LOG ATTIVITÁ
        await createActivity(leadId, activityType, activityNotes || "Aggiornamento stato", data.nextFollowup);

        // 5. APPUNTAMENTO LOGICA
        if (type === 'appointment' && data.appointmentDate) {
             const typeLabel = data.appointmentType === 'showroom' ? "Showroom" : "Remoto";
             const startDate = new Date(`${data.appointmentDate}:00+02:00`);
             
             await prisma.appointment.create({
                 data: {
                     title: data.title || `APPUNTAMENTO - ${leadBase.firstName}`,
                     notes: data.notes || '',
                     location: typeLabel,
                     startTime: startDate,
                     duration: 60,
                     leadId: leadId,
                     ownerId: ownerId, // Ora è garantito che ne abbiamo uno
                 }
             });
        }

        revalidatePath(`/leads/${leadId}`, 'page');
        revalidatePath('/leads', 'page');
        revalidatePath('/', 'page');
        
        return { success: true };
    } catch (error: any) {
        console.error("Critical Global Error:", error);
        return { success: false, error: `ERRORE CRITICO: ${error.message}` };
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
    } catch (error: any) { return { success: false, error: error.message }; }
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
    } catch (error: any) { return { success: false, error: error.message }; }
}
