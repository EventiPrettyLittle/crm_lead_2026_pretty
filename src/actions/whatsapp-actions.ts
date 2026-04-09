'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { it } from "date-fns/locale"

/**
 * Sends a WhatsApp template based on the lead's current stage/action.
 * Variables MUST match the order in SendApp templates.
 * Based on user feedback:
 * 1. Must use "appuntamento in show room" or "richiamata" based on selection.
 * 2. Date format must be human-readable (IT).
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

        const templateName = actionType === 'contacted' 
            ? (process.env.WHATSAPP_TEMPLATE_NAME_CONTACTED || 'contattato')
            : actionType === 'no-answer'
            ? (process.env.WHATSAPP_TEMPLATE_NAME_NO_ANSWER || 'non_risponde')
            : (process.env.WHATSAPP_TEMPLATE_NAME_APPOINTMENT || 'notifica_cliente');

        if (!templateName) {
            return { success: false, error: "Template non configurato" };
        }

        // Formattazione data corretta per l'utente (es: 15/04/2026 alle 10:30)
        let formattedDate = "-";
        if (context?.date) {
            try {
                const dateObj = new Date(context.date);
                formattedDate = format(dateObj, "dd/MM/yyyy 'alle' HH:mm", { locale: it });
            } catch (e) {
                formattedDate = context.date;
            }
        }

        // Definizione variabili dinamiche in base alla scelta
        const typeValue = context?.type === 'showroom' ? "appuntamento in show room" : "richiamata";
        
        // Ordine variabili SendApp (adeguiamo in base al feedback "copi matrimonio il giorno")
        // Se il template è: "Ciao {1}, il tuo evento {2} è un {3} il giorno {4}"
        const variables = [
            lead.firstName || "Cliente",
            lead.eventType || "Evento",
            typeValue,
            formattedDate
        ];

        const res = await sendWhatsAppTemplate({
            to: lead.phoneRaw,
            templateName,
            bodyVariables: variables
        });

        if (res.success) {
            const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
            
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Inviato WhatsApp: ${typeValue.toUpperCase()} per ${formattedDate}`
                }
            });

            // Aggiornamento note interne senza sporcare con titoli inutili
            const currentNotes = lead.notesInternal || "";
            const systemNote = `[WhatsApp - ${timestamp}]: Inviato "${typeValue}" per il ${formattedDate}\n\n`;
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
