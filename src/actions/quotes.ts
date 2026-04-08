'use server'

import { revalidatePath } from 'next/cache'
import { createActivity } from './lead-detail'
import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"
import { getCompanySettings } from './settings'

export async function getLeadsMini() {
    const leads = await prisma.lead.findMany({
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { updatedAt: 'desc' },
        take: 50
    });
    return serializePrisma(leads);
}

export async function updateQuoteLead(quoteId: string, leadId: string) {
    await prisma.quote.update({
        where: { id: quoteId },
        data: { leadId }
    });
    revalidatePath('/quotes');
}

// Helper potenziato per mappare i risultati raw (che spesso arrivano lowercase da Postgres)
function mapRawToPrisma(raw: any) {
    if (!raw) return null;
    const mapped: any = { ...raw };
    
    // Iteriamo su tutte le chiavi per mappare correttamente indipendentemente dal case
    Object.keys(raw).forEach(key => {
        const lower = key.toLowerCase();
        const val = raw[key];
        
        if (lower === 'leadid') mapped.leadId = val;
        if (lower === 'totalamount') mapped.totalAmount = val;
        if (lower === 'discounttotal') mapped.discountTotal = val;
        if (lower === 'paymentmethod') mapped.paymentMethod = val;
        if (lower === 'quoteid') mapped.quoteId = val;
        if (lower === 'totalprice') mapped.totalPrice = val;
        if (lower === 'originalprice') mapped.originalPrice = val;
        if (lower === 'unitprice') mapped.unitPrice = val;
        if (lower === 'vatrate') mapped.vatRate = val;
        if (lower === 'createdat') mapped.createdAt = val;
        if (lower === 'updatedat') mapped.updatedAt = val;
        if (lower === 'createdby') mapped.createdBy = val;
    });

    return mapped;
}

export async function getQuotes(search?: string) {
    const quotes = await prisma.quote.findMany({
        where: search ? {
            OR: [
                { lead: { firstName: { contains: search } } },
                { lead: { lastName: { contains: search } } },
                { lead: { email: { contains: search } } },
                { number: isNaN(parseInt(search)) ? undefined : parseInt(search) }
            ]
        } : {},
        include: {
            lead: true,
            items: true
        },
        orderBy: { createdAt: 'desc' }
    });
    return serializePrisma(quotes);
}

export async function createQuote(leadId: string) {
    // Prendiamo il referente dalle credenziali di login se disponibili
    const { getCurrentUser } = await import("./auth");
    const userSession = await getCurrentUser();
    
    const settings = await getCompanySettings();
    const creator = userSession?.name || settings?.referente || "Luca Vitale";

    const count = await prisma.quote.count();
    const nextNumber = count + 1;

    // Usiamo Raw SQL per creare il preventivo includendo createdBy (che non è nello schema Prisma generato)
    const id = Math.random().toString(36).substring(2);
    await prisma.$executeRawUnsafe(
        `INSERT INTO "Quote" (id, number, "leadId", status, "createdBy", "totalAmount", "discountTotal", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        id, nextNumber, leadId, 'BOZZA', creator, 0, 0
    );

    revalidatePath(`/leads/${leadId}`);
    return serializePrisma({ id, number: nextNumber, leadId, status: 'BOZZA', createdBy: creator });
}

export async function getQuote(id: string) {
    const quoteResults: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Quote" WHERE id = $1`, id);
    if (quoteResults.length === 0) return null;
    
    let quote = mapRawToPrisma(quoteResults[0]);
    
    // Fetch items with raw SQL
    const rawItems: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "QuoteItem" WHERE "quoteId" = $1 ORDER BY "id" ASC`, id);
    quote.items = rawItems.map(item => mapRawToPrisma(item));
    
    // Fetch lead
    const lead = await prisma.lead.findUnique({ where: { id: quote.leadId } });
    quote.lead = lead;

    // Fetch company settings for PDF
    const settings = await getCompanySettings();
    quote.companySettings = settings;
    
    return serializePrisma(quote);
}

export async function deleteQuote(id: string, leadId: string) {
    await prisma.quote.delete({
        where: { id }
    });
    revalidatePath(`/leads/${leadId}`);
}

export async function addItemToQuote(quoteId: string, data: { description: string, quantity: number, originalPrice?: number, unitPrice: number, discount?: number, vatRate: number }) {
    const totalPrice = data.quantity * data.unitPrice;
    const id = Math.random().toString(36).substring(2);

    try {
        await prisma.$executeRawUnsafe(
            `INSERT INTO "QuoteItem" (id, "quoteId", description, quantity, "originalPrice", "unitPrice", discount, "vatRate", "totalPrice") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            id, quoteId, data.description, data.quantity, data.originalPrice || data.unitPrice, data.unitPrice, data.discount || 0, data.vatRate, totalPrice
        );
    } catch (e: any) {
        console.warn("Fallback insert QuoteItem (missing columns):", e.message);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "QuoteItem" (id, "quoteId", description, quantity, "unitPrice", "vatRate", "totalPrice") 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            id, quoteId, data.description, data.quantity, data.unitPrice, data.vatRate, totalPrice
        );
    }

    await updateQuoteTotal(quoteId);
    revalidatePath('/quotes');
    revalidatePath('/finance');
}

export async function updateQuoteDetails(id: string, data: { paymentMethod?: string, discountTotal?: number, notes?: string, createdBy?: string }) {
    // Aggiornamento tramite Raw SQL per includere createdBy
    if (data.createdBy) {
         await prisma.$executeRawUnsafe(
            `UPDATE "Quote" SET "createdBy" = $1 WHERE id = $2`,
            data.createdBy, id
        );
    }

    await prisma.quote.update({
        where: { id },
        data: {
            paymentMethod: data.paymentMethod,
            discountTotal: data.discountTotal,
            notes: data.notes
        } as any
    });

    await updateQuoteTotal(id);
    revalidatePath('/quotes');
    revalidatePath('/finance');
}

export async function deleteQuoteItem(itemId: string, quoteId: string) {
    await prisma.$executeRawUnsafe(`DELETE FROM "QuoteItem" WHERE id = $1`, itemId);
    await updateQuoteTotal(quoteId);
    revalidatePath('/quotes');
    revalidatePath('/finance');
}

export async function sendQuoteByEmail(quoteId: string) {
    const quote = await getQuote(quoteId);
    if (!quote || !quote.lead?.email) {
        return { success: false, error: "Quote or lead email not found" };
    }

    try {
        const { sendEmail } = await import('@/lib/email');
        const { renderToBuffer } = await import('@react-pdf/renderer');
        const { QuoteDocument } = await import('@/components/quotes/quote-pdf');
        const React = await import('react');

        // Generazione PDF sul server
        const doc = React.createElement(QuoteDocument, { quote }) as any;
        const buffer = await renderToBuffer(doc);

        await sendEmail({
            to: quote.lead.email,
            subject: `Preventivo #${quote.number} - PLATINUM CRM`,
            body: `Gentile ${quote.lead.firstName},\n\nin allegato il preventivo #${quote.number} richiesto.\n\nCordiali saluti,\nPlatinum CRM`,
            attachment: {
                filename: `preventivo_${quote.number}.pdf`,
                content: buffer
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Email send error:", error);
        return { success: false, error: error.message || "Errore invio email" };
    }
}

export async function updateQuoteStatus(id: string, status: string, leadId: string) {
    await prisma.$executeRawUnsafe(
        `UPDATE "Quote" SET "status" = $1 WHERE id = $2`,
        status, id
    );

    // Registriamo l'attività nel lead
    await createActivity(leadId, 'SYSTEM', `Stato preventivo aggiornato a: ${status}`);

    revalidatePath('/quotes');
    revalidatePath(`/leads/${leadId}`);
    return { success: true };
}

async function updateQuoteTotal(quoteId: string) {
    const items: any[] = await prisma.$queryRawUnsafe(`SELECT "totalPrice" FROM "QuoteItem" WHERE "quoteId" = $1`, quoteId);
    const itemsTotal = items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
    
    const quotes: any[] = await prisma.$queryRawUnsafe(`SELECT "discountTotal" FROM "Quote" WHERE id = $1`, quoteId);
    const discountTotal = quotes.length > 0 ? Number(quotes[0].discountTotal || 0) : 0;
    
    const finalTotal = itemsTotal - discountTotal;

    await prisma.$executeRawUnsafe(
        `UPDATE "Quote" SET "totalAmount" = $1 WHERE id = $2`,
        Math.max(0, finalTotal), quoteId
    );
}
