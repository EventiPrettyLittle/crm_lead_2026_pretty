'use server'

import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from 'date-fns'

export async function getDashboardStats() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Total Leads
    const totalLeads = await prisma.lead.count();

    // 2. Today's Tasks (Follow-ups due today + Missed status)
    const todayTasks = await prisma.lead.count({
        where: {
            OR: [
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

    // 3. Pipeline Value (Sum of all open Quotes)
    // Assuming status != 'RIFIUTATO' means active pipeline
    const quotes = await prisma.quote.findMany({
        where: {
            status: { not: 'RIFIUTATO' }
        },
        select: { totalAmount: true }
    });

    // Sum totalAmount (Decimal needs conversion)
    const pipelineValue = quotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);

    // 4. Conversion Rate (Won / Total Closed)
    const won = await prisma.lead.count({ where: { stage: 'VINTO' } });
    const lost = await prisma.lead.count({ where: { stage: 'PERSO' } });
    const totalClosed = won + lost;
    const conversionRate = totalClosed > 0 ? (won / totalClosed) * 100 : 0;

    return {
        totalLeads,
        todayTasks,
        pipelineValue,
        conversionRate
    };
}
