'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { addDays, setHours, setMinutes } from 'date-fns'
import { createActivity } from './lead-detail'
import { serializePrisma } from "@/lib/serialize"

export async function markQuoteAsSent(quoteId: string, leadId: string) {
    try {
        const now = new Date();
        
        const existingQuote = await prisma.quote.findUnique({ where: { id: quoteId } });
        const shouldUpdateStatus = existingQuote?.status === 'BOZZA';

        // 1. Update Quote
        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                sentAt: now,
                ...(shouldUpdateStatus ? { status: 'INVIATO' } : {})
            }
        });

        if (shouldUpdateStatus) {
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
            const followUpDate = setHours(setMinutes(addDays(now, 7), 0), 10); // 10:00 AM default

            await createActivity(
                leadId,
                'FOLLOWUP',
                "Follow-up preventivo gratuito (Auto-generated)",
                followUpDate
            );

            await prisma.lead.update({
                where: { id: leadId },
                data: { nextFollowupAt: followUpDate }
            });
        } else {
             // Just log that an updated version was sent
             await createActivity(leadId, 'SYSTEM', `Inviato aggiornamento del preventivo (Stato: ${existingQuote?.status}).`);
        }

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/quotes');
        return serializePrisma({ success: true });
    } catch (error) {
        console.error("Error marking quote as sent:", error);
        return serializePrisma({ success: false, error });
    }
}
