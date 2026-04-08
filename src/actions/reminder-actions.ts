'use server'

import prisma from "@/lib/prisma"

export async function getDueRemindersAction() {
    try {
        const now = new Date();
        
        // Cerchiamo i lead con un followup scaduto o imminente (nelle ultime 24 ore fino ad ora)
        // e che non siano già stati chiusi (status diverso da VINTO/PERSO/CANCELLATO)
        const dueLeads = await prisma.lead.findMany({
            where: {
                nextFollowupAt: {
                    lte: now,
                    // Evitiamo di recuperare robba troppo vecchia di giorni, limitiamoci alle ultime 48h
                    gte: new Date(now.getTime() - 48 * 60 * 60 * 1000)
                },
                stage: {
                    notIn: ['VINTO', 'PERSO', 'CANCELLATO']
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                nextFollowupAt: true,
                phoneRaw: true
            },
            orderBy: {
                nextFollowupAt: 'desc'
            }
        });

        return { success: true, reminders: dueLeads };
    } catch (error) {
        console.error("Error fetching reminders:", error);
        return { success: false, reminders: [] };
    }
}
