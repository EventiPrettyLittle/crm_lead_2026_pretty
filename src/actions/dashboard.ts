'use server'

import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from 'date-fns'

export async function getDashboardStats() {
    try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        // 1. Total Leads
        const totalLeads = await prisma.lead.count().catch(() => 0);

        const todayTasks = await prisma.lead.count({
            where: {
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
        }).catch(() => 0);

        // 3. Pipeline Value
        const pipelineQuotes = await prisma.quote.findMany({
            where: { status: { in: ['BOZZA', 'INVIATO'] } },
            select: { totalAmount: true }
        }).catch(() => []);
        const pipelineValue = pipelineQuotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);

        // 4. Actual Revenue
        const revenueQuotes = await prisma.quote.findMany({
            where: { status: 'ACCETTATO' },
            select: { totalAmount: true }
        }).catch(() => []);
        const totalRevenue = revenueQuotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);

        // 5. Conversion Rate
        const won = await prisma.lead.count({ where: { stage: 'VINTO' } }).catch(() => 0);
        const lost = await prisma.lead.count({ where: { stage: 'PERSO' } }).catch(() => 0);
        const totalClosed = won + lost;
        const conversionRate = totalClosed > 0 ? (won / totalClosed) * 100 : 0;

        // 5. Nuovi Lead (Recenti)
        const recentLeads = await prisma.lead.findMany({
            where: { stage: 'NUOVO' },
            orderBy: { createdAt: 'desc' },
            take: 6
        }).catch(() => []);

        // 6. Check Gestione (Oggi)
        const activitiesToday = await prisma.activity.findMany({
            where: { createdAt: { gte: todayStart, lte: todayEnd } },
            select: { leadId: true },
            distinct: ['leadId']
        }).catch(() => []);
        const callsDone = activitiesToday.length;

        // 7. Preventivi oggi
        const quotesToday = await prisma.quote.count({
            where: { createdAt: { gte: todayStart, lte: todayEnd } }
        }).catch(() => 0);

        // 8. Programmazione
        const scheduledLeads = await prisma.lead.findMany({
            where: {
                preferredContactTime: { not: null },
                stage: { notIn: ['VINTO', 'PERSO'] }
            },
            orderBy: [ { preferredContactTime: 'asc' }, { createdAt: 'desc' } ],
            take: 10
        }).catch(() => []);

        return {
            totalLeads, todayTasks, pipelineValue, totalRevenue, conversionRate, callsDone, quotesToday, recentLeads, scheduledLeads
        };
    } catch (e) {
        console.error("Dashboard stats crash:", e);
        return {
            totalLeads: 0, todayTasks: 0, pipelineValue: 0, totalRevenue: 0, conversionRate: 0, callsDone: 0, quotesToday: 0, recentLeads: [], scheduledLeads: []
        };
    }
}
