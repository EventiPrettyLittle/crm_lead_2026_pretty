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

export async function addPayment(quoteId: string, amount: number, method: string, notes?: string) {
  const id = Math.random().toString(36).substring(2);
  
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Payment" (id, "quoteId", amount, method, notes, date, "createdAt") 
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    id, quoteId, amount, method, notes || null
  );

  // Recuperiamo il leadId per l'attività
  const quote: any[] = await prisma.$queryRawUnsafe(`SELECT "leadId" FROM "Quote" WHERE id = $1`, quoteId);
  if (quote.length > 0) {
      await createActivity(
        quote[0].leadId,
        'SYSTEM',
        `Registrato pagamento di €${amount.toLocaleString('it-IT')} tramite ${method}`
      );
  }

  revalidatePath('/finance');
  return { success: true };
}

export async function deletePayment(paymentId: string, quoteId: string) {
    await prisma.$executeRawUnsafe(`DELETE FROM "Payment" WHERE id = $1`, paymentId);
    revalidatePath('/finance');
}
