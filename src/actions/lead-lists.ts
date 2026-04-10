'use server'

import prisma from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns'

export type LeadListType = 'today' | 'missed' | 'scheduled' | 'expired' | 'quote-followup' | 'contacted' | 'pending-quotes';

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
                stage: { notIn: ['VINTO', 'PERSO'] }
            };
            break;

        case 'contacted':
            // "Lista di CONTATTATI"
            whereClause = {
                lastStatus: 'CONTATTATO',
                stage: { notIn: ['VINTO', 'PERSO'] }
            };
            orderBy = { lastStatusAt: 'desc' };
            break;

        case 'missed':
            // "Non risponde – da richiamare"
            whereClause = {
                lastStatus: 'NON_RISPONDE',
                stage: { notIn: ['VINTO', 'PERSO'] }
            };
            break;

        case 'scheduled':
            // "Ricontatti programmati" (future)
            whereClause = {
                lastStatus: 'DA_RICONTATTARE',
                nextFollowupAt: {
                    gt: todayEnd,
                },
                stage: { notIn: ['VINTO', 'PERSO'] }
            };
            break;

        case 'expired':
            // "Follow-up scaduti" (past)
            whereClause = {
                nextFollowupAt: {
                    lt: todayStart,
                },
                stage: { notIn: ['VINTO', 'PERSO'] }
            };
            break;

        case 'pending-quotes':
            // "Clienti che hanno ricevuto un preventivo ma non ancora approvato"
            whereClause = {
                stage: 'PREVENTIVO'
            };
            orderBy = { updatedAt: 'desc' };
            break;

        case 'quote-followup':
            // "Follow-up preventivi" - specific follow-up items
            whereClause = {
                stage: 'PREVENTIVO',
                quoteSentAt: { not: null },
                nextFollowupAt: {
                    lte: todayEnd,
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
