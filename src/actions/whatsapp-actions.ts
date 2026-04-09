'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function sendLeadWhatsAppAction(
    leadId: string, 
    actionType: 'contacted' | 'no-answer' | 'schedule',
    context?: { type?: string, date?: string, time?: string }
) {
    try {
        const lead = await getLeadById(leadId);
        if (!lead || !lead.phoneRaw) {
            return { success: false, error: "Lead o numero di telefono non trovato" };
        }

        // Nomi template reali su SendApp – fallback hardcoded se le env var non sono impostate
        const templateName = actionType === 'contacted' 
            ? (process.env.WHATSAPP_TEMPLATE_NAME_CONTACTED || 'contattato')
            : actionType === 'no-answer'
            ? (process.env.WHATSAPP_TEMPLATE_NAME_NO_ANSWER || 'non_risponde')
            : (process.env.WHATSAPP_TEMPLATE_NAME_APPOINTMENT || 'appuntamento');

        if (!templateName) {
            return { success: false, error: "Template non configurato" };
        }

        // Prepare variables
        const variables = [
            lead.firstName || "Cliente"
        ];

        // If it's an appointment, add type, date and time
        if (actionType === 'schedule' && context) {
            variables.push(context.type || "Appuntamento");
            variables.push(context.date || "-");
            variables.push(context.time || "-");
        }

        const res = await sendWhatsAppTemplate({
            to: lead.phoneRaw,
            templateName,
            bodyVariables: variables
        });

        if (res.success) {
            const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
            
            // 1. Log activity in the DB (Timeline)
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Inviato template WhatsApp: ${templateName}`
                }
            });

            // 2. Sync to Internal Notes box (Top)
            const currentNotes = lead.notesInternal || "";
            const systemNote = `[Sistema - ${timestamp}]: Inviato WhatsApp (${templateName})\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + currentNotes }
            });

            revalidatePath(`/leads/${leadId}`);
        }

        return res;
    } catch (error) {
        console.error("Action WhatsApp Error:", error);
        return { success: false, error: "Errore durante l'esecuzione dell'azione" };
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
            
            // 1. Log activity in the DB
            await prisma.activity.create({
                data: {
                    leadId: lead.id,
                    type: "WHATSAPP",
                    notes: `Messaggio WhatsApp inviato: ${message}`
                }
            });

            // 2. Sync to Internal Notes box (Top)
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
        return { success: false, error: "Errore durante l'invio del messaggio" };
    }
}
