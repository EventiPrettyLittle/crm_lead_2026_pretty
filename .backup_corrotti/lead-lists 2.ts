'use server'

import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'

export type LeadListType = 'today' | 'missed' | 'scheduled' | 'expired' | 'quote-followup';

export async function getLeadsByListType(type: LeadListType) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    let whereClause: any = {};
    let orderBy: any = { nextFollowupAt: 'asc' };

    switch (type) {
        case 'today':
            // Leads to contact today (nextFollowupAt is today)
            whereClause = {
                nextFollowupAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
                OR: [
                    { lastStatus: { not: 'CONTATTATO' } }, // Optional: exclude if already contacted today? Per specs: "Da contattare oggi"
                    { lastStatus: null }
                ]
            };
            break;

        case 'missed':
            // "Non risponde – da richiamare"
            whereClause = {
                lastStatus: 'NON_RISPONDE',
                // Usually these have a nextFollowup set, but we specifically look for the status
            };
            break;

        case 'scheduled':
            // "Ricontatti programmati" (future)
            whereClause = {
                lastStatus: 'DA_RICONTATTARE',
                nextFollowupAt: {
                    gt: todayEnd,
                },
            };
            break;

        case 'expired':
            // "Follow-up scaduti" (past)
            whereClause = {
                nextFollowupAt: {
                    lt: todayStart,
                },
                stage: { notIn: ['VINTO', 'PERSO'] } // Don't show closed leads
            };
            break;

        case 'quote-followup':
            // "Follow-up preventivi"
            whereClause = {
                stage: 'PREVENTIVO', // or 'INVIATO' if we use a specific status
                quoteSentAt: { not: null },
                // Logic: maybe sent > 7 days ago? Or just all quotes pending?
                // User spec: "Quando un preventivo viene segnato come INVIATO... Crea automaticamente un follow-up a +7 giorni"
                // So we just rely on nextFollowupAt
                nextFollowupAt: {
                    lte: todayEnd, // Show if due today or past
                }
            }
            break;
    }

    const leads = await prisma.lead.findMany({
        where: whereClause,
        orderBy: orderBy,
        include: {
            owner: true, // Include owner info
        }
    });

    return leads;
}
