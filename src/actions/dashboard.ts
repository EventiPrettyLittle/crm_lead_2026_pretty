'use server'

import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from 'date-fns'

export async function getDashboardStats() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Total Leads
    const totalLeads = await prisma.lead.count();

    const todayTasks = await prisma.lead.count({
        where: {
            deletedAt: null,
            OR: [
                { stage: 'NUOVO' },
                {
                    nextFollowupAt: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                },
                { lastStatus: 'NON_RISPONDE' }
            ]
        }
    });

    // 3. Pipeline Value (Sum of all open/sent Quotes)
    const pipelineQuotes = await prisma.quote.findMany({
        where: {
            status: { in: ['BOZZA', 'INVIATO'] }
        },
        select: { totalAmount: true }
    });
    const pipelineValue = pipelineQuotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);

    // 4. Actual Revenue (Sum of all ACCETTATO Quotes)
    const revenueQuotes = await prisma.quote.findMany({
        where: { status: 'ACCETTATO' },
        select: { totalAmount: true }
    });
    const totalRevenue = revenueQuotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);

    // 5. Conversion Rate (Won / Total Closed)
    const won = await prisma.lead.count({ where: { stage: 'VINTO' } });
    const lost = await prisma.lead.count({ where: { stage: 'PERSO' } });
    const totalClosed = won + lost;
    const conversionRate = totalClosed > 0 ? (won / totalClosed) * 100 : 0;

    // 5. Nuovi Lead (Recenti)
    const recentLeads = await prisma.lead.findMany({
        where: { stage: 'NUOVO' },
        orderBy: { createdAt: 'desc' },
        take: 6
    });

    // 6. Check Gestione (Oggi)
    // Contiamo i lead UNICI che hanno avuto almeno un'attività oggi
    const activitiesToday = await prisma.activity.findMany({
        where: {
            createdAt: { gte: todayStart, lte: todayEnd }
        },
        select: { leadId: true },
        distinct: ['leadId']
    });
    const callsDone = activitiesToday.length;

    // 7. Programmazione (In base all'orario di preferenza)
    // Filtriamo i lead che hanno una preferenza e non sono ancora chiusi
    const scheduledLeads = await prisma.lead.findMany({
        where: {
            preferredContactTime: { not: null },
            stage: { notIn: ['VINTO', 'PERSO'] }
        },
        orderBy: [
            { preferredContactTime: 'asc' },
            { createdAt: 'desc' }
        ],
        take: 10
    });

    return {
        totalLeads,
        todayTasks,
        pipelineValue,
        totalRevenue,
        conversionRate,
        recentLeads,
        callsDone,
        scheduledLeads
    };
}
