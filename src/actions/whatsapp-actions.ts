'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { it } from "date-fns/locale"

/**
 * Sends a WhatsApp template based on the lead's current stage/action.
 * LOGICA RICHIESTA DA LUCA (SENDAPP):
 * {{1}}: Nome del cliente.
 * {{2}}: Selezione (showroom / richiamata / videochiamata).
 * {{3}}: Data (Giorno e Mese, es: 15 Aprile).
 * {{4}}: Ora (es: 10:00).
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

        // Mapping dei nomi template esatti dalle foto
        let templateName = '';
        if (actionType === 'appointment') templateName = 'notifica_cliente';
        else if (actionType === 'contacted') templateName = 'contattato';
        else if (actionType === 'no-answer') templateName = 'non_risponde';

        // Formattazione data e ora come richiesto (Giorno Mese / Ora)
        let dayFormatted = "-";
        let timeFormatted = "-";
        
        if (context?.date) {
            try {
                const dateObj = new Date(context.date);
                dayFormatted = format(dateObj, "d MMMM", { locale: it }); // es: 15 Aprile
                timeFormatted = format(dateObj, "HH:mm", { locale: it }); // es: 10:00
            } catch (e) {
                dayFormatted = context.date;
            }
        }

        // Calcolo valore {{2}} in base alla selezione dell'utente
        let typeValue = "";
        if (context?.type === 'showroom') typeValue = "showroom";
        else if (context?.type === 'video') typeValue = "videochiamata";
        else typeValue = "richiamata";
        
        // Array variabili SECONDO LO SCHEMA FOTOGRAFICO
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

        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

        if (res.success) {
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Inviato template "${templateName}" con variabili: ${variables.join(', ')}`
                }
            });

            // Log veloce nelle note per conferma visiva
            const systemNote = `[WhatsApp - ${timestamp}]: ✅ Inviato template "${templateName}" a ${lead.firstName}\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + (lead.notesInternal || "") }
            });
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
        if (!lead || !lead.phoneRaw) return { success: false, error: "Lead mancante" };

        const res = await sendWhatsAppMessage({ to: lead.phoneRaw, text: message });

        if (res.success) {
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Messaggio libero: ${message}`
                }
            });
            revalidatePath(`/leads/${leadId}`);
        }
        return res;
    } catch (error) { return { success: false, error: "Errore invio" }; }
}
