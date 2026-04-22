'use server'

import { getLeadById } from "@/actions/lead-detail"
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export async function sendLeadWhatsAppAction(
    leadId: string, 
    actionType: 'contacted' | 'no-answer' | 'appointment',
    context?: { type?: string, date?: string }
) {
    try {
        const lead = await getLeadById(leadId);
        if (!lead || !lead.phoneRaw) return { success: false, error: "Lead mancante" };

        let templateName = '';
        if (actionType === 'appointment') templateName = 'notifica_cliente';
        else if (actionType === 'contacted') templateName = 'contattato';
        else if (actionType === 'no-answer') templateName = 'non_risponde';

        let dayFormatted = "-";
        let timeFormatted = "-";
        if (context?.date) {
            try {
                const dateObj = new Date(context.date);
                dayFormatted = format(dateObj, "d MMMM", { locale: it });
                timeFormatted = format(dateObj, "HH:mm", { locale: it });
            } catch (e) {}
        }

        let typeValue = "";
        if (context?.type === 'showroom') typeValue = "showroom";
        else if (context?.type === 'video') typeValue = "videochiamata";
        else typeValue = "richiamata";
        
        const variables = actionType === 'appointment' 
            ? [lead.firstName || "Cliente", typeValue, dayFormatted, timeFormatted]
            : [lead.firstName || "Cliente"];

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
                    notes: `✅ Inviato template "${templateName}"`
                }
            });
            const systemNote = `[WhatsApp - ${timestamp}]: ✅ INVIATO: "${templateName}"\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemNote + (lead.notesInternal || "") }
            });
        } else {
            // RIPRISTINO ERRORE DETTAGLIATO NELLE NOTE (Come richiesto)
            const errorMsg = res.error || "Errore SendApp";
            const systemError = `[WhatsApp - ${timestamp}]: ❌ FALLITO: ${errorMsg}\n(Template: ${templateName})\n\n`;
            await prisma.lead.update({
                where: { id: leadId },
                data: { notesInternal: systemError + (lead.notesInternal || "") }
            });
        }

        return res;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendFreeWhatsAppMessageAction(leadId: string, message: string) {
    try {
        const lead = await getLeadById(leadId);
        if (!lead || !lead.phoneRaw) return { success: false, error: "Lead mancante" };
        const res = await sendWhatsAppMessage({ to: lead.phoneRaw, text: message });
        if (res.success) {
            revalidatePath(`/leads/${leadId}`);
        }
        return res;
    } catch (error) { return { success: false, error: "Errore" }; }
}
