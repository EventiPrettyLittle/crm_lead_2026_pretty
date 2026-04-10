'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { it } from "date-fns/locale"

/**
 * Sends a WhatsApp template based on the lead's current stage/action.
 * FIXED VARIABLE MAPPING FOR SENDAPP:
 * {{1}}: Nome del cliente.
 * {{2}}: Tipo di appuntamento (appuntamento in show room / richiamata).
 * {{3}}: Data dell'appuntamento (es: 15 Aprile).
 * {{4}}: Ora dell'appuntamento (es: 10:30).
 */
export async function sendLeadWhatsAppAction(
    leadId: string, 
    actionType: 'contacted' | 'no-answer' | 'appointment',
    context?: { type?: string, date?: string }
) {
    try {
        const lead = await getLeadById(leadId);
        if (!lead || !lead.phoneRaw) {
            return { success: false, error: "Lead o numero di telefono non trovato" };
        }

        const isCall = actionType === 'no-answer' || context?.type === 'call';
        
        const templateName = actionType === 'contacted' 
            ? (process.env.WHATSAPP_TEMPLATE_NAME_CONTACTED || 'contattato')
            : isCall
            ? (process.env.WHATSAPP_TEMPLATE_NAME_NO_ANSWER || 'non_risponde')
            : (process.env.WHATSAPP_TEMPLATE_NAME_APPOINTMENT || 'notifica_cliente');

        if (!templateName) {
            return { success: false, error: "Template non configurato" };
        }

        // Formattazione specifica per le variabili richieste
        let dayFormatted = "-";
        let timeFormatted = "-";
        
        if (context?.date) {
            try {
                const dateObj = new Date(context.date);
                dayFormatted = format(dateObj, "d MMMM", { locale: it }); // es: 15 Aprile
                timeFormatted = format(dateObj, "HH:mm", { locale: it }); // es: 10:30
            } catch (e) {
                dayFormatted = context.date;
            }
        }

        // Definizione variabili dinamiche in base alla scelta esatta dell'utente
        const typeValue = actionType === 'contacted'
            ? "contattato"
            : actionType === 'no-answer'
            ? "non_risponde"
            : context?.type === 'showroom' 
            ? "Showroom" 
            : context?.type === 'video'
            ? "videochiamata"
            : "richiamata";
        
        // Costruzione array variabili SECONDO LO SCHEMA RICHIESTO
        // Se è un appuntamento mandiamo tutte le variabili, altrimenti solo il nome
        const variables = actionType === 'appointment' 
            ? [
                lead.firstName || "Cliente", // {{1}}
                typeValue,                   // {{2}}
                dayFormatted,                // {{3}}
                timeFormatted                // {{4}}
              ]
            : [
                lead.firstName || "Cliente"  // {{1}}
              ];

        const res = await sendWhatsAppTemplate({
            to: lead.phoneRaw,
            templateName,
            bodyVariables: variables
        });

        if (res.success) {
            const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
            
            const activityNote = actionType === 'appointment'
                ? `Inviato WhatsApp: ${typeValue} per il ${dayFormatted} alle ${timeFormatted}`
                : `Inviato WhatsApp: ${typeValue}`;

            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: activityNote
                }
            });

            const currentNotes = lead.notesInternal || "";
            const systemNoteContent = actionType === 'appointment'
                ? `Inviato "${typeValue}" (${dayFormatted} ore ${timeFormatted})`
                : `Inviato template "${typeValue}"`;
            
            const systemNote = `[WhatsApp - ${timestamp}]: ${systemNoteContent}\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + currentNotes }
            });

            revalidatePath(`/leads/${leadId}`);
        }

        return res;
    } catch (error) {
        console.error("Action WhatsApp Error:", error);
        return { success: false, error: "Errore nell'invio del messaggio" };
    }
}

export async function sendFreeWhatsAppMessageAction(leadId: string, message: string) {
    try {
        const lead = await getLeadById(leadId);
        if (!lead || !lead.phoneRaw) {
            return { success: false, error: "Lead o numero di telefono non trovato" };
        }

        const res = await sendWhatsAppMessage({
            to: lead.phoneRaw,
            text: message
        });

        if (res.success) {
            const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
            
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Messaggio libero inviato: ${message}`
                }
            });

            const currentNotes = lead.notesInternal || "";
            const systemNote = `[WhatsApp - ${timestamp}]: ${message}\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + currentNotes }
            });

            revalidatePath(`/leads/${leadId}`);
        }

        return res;
    } catch (error) {
        console.error("Action Free WhatsApp Error:", error);
        return { success: false, error: "Errore nell'invio del messaggio" };
    }
}
