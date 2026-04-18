'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { createActivity } from "./lead-detail";

export async function getAcceptedQuotes() {
  // Usiamo Raw SQL per superare eventuali problemi di generazione client
  const quotes: any[] = await prisma.$queryRawUnsafe(`
    SELECT q.*, 
           l.id as "lead_id", l."firstName", l."lastName", l.email as "lead_email"
    FROM "Quote" q
    JOIN "Lead" l ON q."leadId" = l.id
    WHERE q.status = 'ACCETTATO'
    ORDER BY q."updatedAt" DESC
  `);

  // Mappiamo i lead e recuperiamo i pagamenti per ciascuno
  const quotesWithData = await Promise.all(quotes.map(async (q) => {
    const rawPayments: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Payment" WHERE "quoteId" = $1 ORDER BY date DESC`, 
      q.id
    );
    
    return {
      ...q,
      lead: { id: q.lead_id, firstName: q.firstName, lastName: q.lastName, email: q.lead_email },
      payments: rawPayments
    };
  }));

  return serializePrisma(quotesWithData);
}

export async function getLeadFinanceData(leadId: string) {
  // 1. Recuperiamo tutti i preventivi accettati per questo lead per calcolare il dovuto
  const quotes: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, "totalAmount", status FROM "Quote" WHERE "leadId" = $1 AND status = 'ACCETTATO'`, 
    leadId
  );

  // 2. Recuperiamo tutti i pagamenti collegati a questo lead (sia diretti che via preventivo)
  const payments: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Payment" WHERE "leadId" = $1 OR "quoteId" IN (SELECT id FROM "Quote" WHERE "leadId" = $1) ORDER BY date DESC`,
    leadId
  );

  const totalBudget = quotes.reduce((acc, q) => acc + Number(q.totalAmount), 0);
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const balance = totalBudget - totalPaid;

  return serializePrisma({
    totalBudget,
    totalPaid,
    balance,
    payments,
    quotesCount: quotes.length
  });
}

export async function addPayment(quoteId: string | null, amount: number, method: string, notes?: string, leadId?: string, paymentDate?: Date) {
  try {
    const id = Math.random().toString(36).substring(2);
    const dateToUse = paymentDate || new Date();
    
    // Inserimento standard via Prisma per massima stabilità
    await (prisma as any).payment.create({
      data: {
        id,
        amount: amount,
        method,
        notes: notes || null,
        date: dateToUse,
        leadId: leadId || null,
        quoteId: quoteId || null
      }
    });

    // Se abbiamo il leadId, creiamo l'attività
    if (leadId) {
        await createActivity(
          leadId,
          'SYSTEM',
          `💰 Incasso di €${amount.toLocaleString('it-IT')} del ${dateToUse.toLocaleDateString('it-IT')} (${method}).`
        );
    }

    revalidatePath('/finance');
    if (leadId) revalidatePath(`/leads/${leadId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("ADD PAYMENT ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePayment(paymentId: string, leadId?: string) {
    await (prisma as any).payment.delete({
      where: { id: paymentId }
    });
    revalidatePath('/finance');
    if (leadId) revalidatePath(`/leads/${leadId}`);
    return { success: true };
}
