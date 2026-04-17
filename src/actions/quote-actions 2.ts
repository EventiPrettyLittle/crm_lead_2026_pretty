'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { addDays, setHours, setMinutes } from 'date-fns'
import { createActivity } from './lead-detail'
import { serializePrisma } from "@/lib/serialize"

export async function markQuoteAsSent(quoteId: string, leadId: string) {
    try {
        const now = new Date();

        // 1. Update Quote
        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                status: 'INVIATO',
                sentAt: now
            }
        });

        // 2. Update Lead
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                quoteSentAt: now,
                stage: 'PREVENTIVO' // Move stage
            }
        });

        // 3. Log Activity: "Preventivo inviato"
        await createActivity(leadId, 'SYSTEM', `Quote sent. Status updated to PREVENTIVO.`);

        // 4. Auto-Schedule Follow-up (+7 days)
        // "Quando un preventivo viene segnato come INVIATO... Crea automaticamente un follow-up a +7 giorni"
        const followUpDate = setHours(setMinutes(addDays(now, 7), 0), 10); // 10:00 AM default

        await createActivity(
            leadId,
            'FOLLOWUP',
            "Follow-up preventivo gratuito (Auto-generated)",
            followUpDate
        );

        // Should we also update nextFollowupAt on Lead? Yes, usually.
        await prisma.lead.update({
            where: { id: leadId },
            data: { nextFollowupAt: followUpDate }
        });

        revalidatePath(`/leads/${leadId}`);
        return serializePrisma({ success: true });
    } catch (error) {
        console.error("Error marking quote as sent:", error);
        return serializePrisma({ success: false, error });
    }
}
