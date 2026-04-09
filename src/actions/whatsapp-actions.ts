'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Sends a WhatsApp template based on the lead's current stage/action.
 * IMPORTANT: Variable order for 'appointment' template must be: [Nome Cliente, Nome Evento, Tipo Appuntamento, Data/Ora]
 * Appointment types requested: "appuntamento in show room" | "richiamata"
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

        // Real template names from environment or defaults
        const templateName = actionType === 'contacted' 
            ? (process.env.WHATSAPP_TEMPLATE_NAME_CONTACTED || 'contattato')
            : actionType === 'no-answer'
            ? (process.env.WHATSAPP_TEMPLATE_NAME_NO_ANSWER || 'non_risponde')
            : (process.env.WHATSAPP_TEMPLATE_NAME_APPOINTMENT || 'notifica_cliente');

        if (!templateName) {
            return { success: false, error: "Template non configurato" };
        }

        // Base variables: [Nome Cliente, Nome Evento]
        const variables = [
            lead.firstName || "Cliente",
            lead.eventType || "Evento"
        ];

        // Specific handling for appointment to match user's exact requested strings
        if (actionType === 'appointment' && context) {
            const typeLabel = context.type === 'showroom' ? "appuntamento in show room" : "richiamata";
            variables.push(typeLabel);
            variables.push(context.date || "-");
        }

        const res = await sendWhatsAppTemplate({
            to: lead.phoneRaw,
            templateName,
            bodyVariables: variables
        });

        if (res.success) {
            const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
            
            // Log to activity timeline
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Inviato WhatsApp: ${actionType.toUpperCase()} - Dati: ${variables.join(', ')}`
                }
            });

            // Sync to Internal Notes for immediate visibility
            const currentNotes = lead.notesInternal || "";
            const systemNote = `[WhatsApp - ${timestamp}]: ${actionType.toUpperCase()} inviato (Msg: ${variables[2] || actionType} per ${lead.eventType})\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + currentNotes }
            });

            revalidatePath(`/leads/${leadId}`);
        }

        return res;
    } catch (error) {
        console.error("Action WhatsApp Error:", error);
        return { success: false, error: "Errore durante l'invio del messaggio" };
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
                    notes: `Messaggio libero WhatsApp inviato: ${message}`
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
        return { success: false, error: "Errore durante l'invio del messaggio libero" };
    }
}
