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

        // 1. RECUPERO LEAD (Dati freschi)
        const leadBase = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!leadBase) {
            return { success: false, error: "ERRORE: Cliente non trovato nel DB." };
        }

        // 2. RECUPERO OPERATORE
        const cookieStore = await cookies();
        const session = cookieStore.get('PLATINUM_AUTH_SESSION');
        let ownerId = null;
        if (session) {
            try {
                const sessionData = JSON.parse(session.value);
                ownerId = sessionData.id || null;
            } catch (e) {}
        }
        if (!ownerId) return { success: false, error: "ERRORE: Tua sessione scaduta. Rifai il login." };

        // 3. PREPARAZIONE LOGICA ATTIVITÁ
        let activityType = 'SYSTEM';
        let activityNotes = data.notes || '';
        
        if (type === 'contacted') activityType = 'CALL';
        else if (type === 'no-answer') activityType = 'RICHIAMO';
        else if (type === 'appointment') activityType = 'SYSTEM';

        // 4. PREPARAZIONE NOTA DI SISTEMA
        const user = await getCurrentUser();
        const initials = getInitials(user?.name || "??");
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
        const systemNote = `[OK - ${initials} - ${timestamp}]: Stato -> ${newStage}.${activityNotes ? ' Note: ' + activityNotes : ''}\n\n`;

        // 5. UPDATE ATOMICO (QUI POTREBBE CRASHRE)
        try {
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
        } catch (dbError: any) {
            console.error("DB UPDATE FAILED:", dbError);
            return { success: false, error: `ERRORE DATABASE: ${dbError.message}` };
        }

        // 6. LOG ATTIVITÁ (NON BLOCCANTE)
        try {
            await createActivity(leadId, activityType, activityNotes || "Cambio stato manuale", data.nextFollowup);
        } catch (actErr) {
            console.warn("Activity Log Failed (non-critical):", actErr);
        }

        // 7. APPUNTAMENTO GOOGLE (NON BLOCCANTE)
        if (type === 'appointment' && data.appointmentDate) {
             try {
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
                        ownerId: ownerId,
                    }
                });
             } catch (appErr: any) {
                 console.error("Appt Creation Error:", appErr);
                 // Continuiamo comunque perché lo stage è già stato salvato
             }
        }

        // 8. REVALIDATE & RETURN
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
