'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createActivity } from './lead-detail'
import { createCalendarEvent } from './calendar'
import { getCurrentUser } from './auth'
import { getInitials } from '@/lib/utils'

/**
 * FIXED Quick Activity Action
 * Handles state transitions and triggers Google Calendar sync for appointments.
 */
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
                // Proviamo prima l'ID diretto dal cookie (più sicuro)
                ownerId = sessionData.id || null;
                
                // Fallback se l'ID manca nel cookie: cerchiamo per email
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
        
        if (!ownerId) return { success: false, error: "Identità operatore non trovata. Per favore effettua Logout e nuovo Login." };

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
            
            const typeLabel = data.appointmentType === 'showroom' 
                ? "appuntamento in show room" 
                : data.appointmentType === 'video'
                ? "videochiamata"
                : "richiamata";
            activityNotes = `${typeLabel} fissato per il ${data.appointmentDate}. ${activityNotes}`;

            // Costruiamo le stringhe ISO forzando l'orario locale (Roma +02:00 / +01:00)
            // Nota: Per ora usiamo +02:00 fisso o ricavato in modo più pulito
            const timezoneOffset = "+02:00"; 
            const startISO = `${data.appointmentDate}:00${timezoneOffset}`;
            const startDate = new Date(startISO);
            
            // Calcoliamo la fine (+1 ora)
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            
            // Formattiamo endISO in modo coerente
            const year = endDate.getFullYear();
            const month = String(endDate.getMonth() + 1).padStart(2, '0');
            const day = String(endDate.getDate()).padStart(2, '0');
            const hours = String(endDate.getHours()).padStart(2, '0');
            const minutes = String(endDate.getMinutes()).padStart(2, '0');
            const endISO = `${year}-${month}-${day}T${hours}:${minutes}:00${timezoneOffset}`;

            const finalTitle = data.title || `${typeLabel.toUpperCase()} - ${leadBase.firstName || 'Cliente'} ${leadBase.lastName || ''}`;

            // 1. CREAZIONE LOCALE IMMEDIATA (Non può fallire se l'ownerId c'è)
            const app = await prisma.appointment.create({
                data: {
                    title: finalTitle,
                    notes: data.notes || '',
                    location: data.appointmentType === 'showroom' ? "Showroom" : data.appointmentType === 'video' ? "Videochiamata" : "Richiamata Telefonica",
                    startTime: startDate,
                    duration: 60,
                    leadId: leadId,
                    ownerId: ownerId,
                }
            });

            // 2. TENTATIVO DI SINCRONIZZAZIONE GOOGLE (Indipendente)
            const syncResult = await createCalendarEvent({
                title: finalTitle,
                description: `Appuntamento fissato dal CRM. Note: ${data.notes || 'nessuna'}`,
                location: data.appointmentType === 'showroom' ? "Showroom" : data.appointmentType === 'video' ? "Videochiamata" : "Richiamata Telefonica",
                startDateTime: startISO,
                endDateTime: endISO,
                leadId: leadId
            });

            if (!syncResult.success) {
                console.error("Calendar Sync Error (Google):", syncResult.error);
                activityNotes = `${activityNotes} (CRM: OK, Google Sync: ⚠ ${syncResult.error})`;
            } else if (syncResult.eventId) {
                // Se Google ha successo, aggiorniamo l'appuntamento locale con il googleEventId
                await prisma.appointment.update({
                    where: { id: app.id },
                    data: { googleEventId: syncResult.eventId }
                });
            }
        } else if (type === 'whatsapp' as any) {
            // Logica assoluta richiesta: il tag cambia in base al template inviato
            const notes = activityNotes.toLowerCase();
            if (notes.includes('showroom') || notes.includes('appuntamento')) {
                 updateData.stage = 'APPUNTAMENTO';
                 updateData.lastStatus = 'APPUNTAMENTO';
            } else if (notes.includes('non_risponde') || notes.includes('non risponde')) {
                 updateData.stage = 'NON_RISPONDE';
                 updateData.lastStatus = 'NON_RISPONDE';
            } else {
                 updateData.stage = 'CONTATTATO';
                 updateData.lastStatus = 'CONTATTATO';
            }
            
            activityType = 'WHATSAPP';
            activityNotes = `Messaggio WhatsApp inviato. ${activityNotes}`;
        }

        // PREPARAZIONE NOTE DI SISTEMA (RIPRISTINO ORIGINALE)
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

        // Create Activity log
        await createActivity(leadId, activityType, activityNotes, data.nextFollowup);

        // FORZIAMO L'AGGIORNAMENTO DELLE ETICHETTE (QUESTO È IL SEGRETO)
        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/'); // Aggiorna anche la dashboard

        revalidatePath('/', 'layout');
        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        
        return { success: true, refresh: true };
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
                eventType: data.eventType || null,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                eventLocation: data.eventLocation || null,
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
