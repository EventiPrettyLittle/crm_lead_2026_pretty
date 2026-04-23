'use server'

import { revalidatePath } from 'next/cache'
import { createActivity } from './lead-detail'
import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"
import { getCurrentUser } from './auth'
import { getCompanySettings } from './settings'
import { getSystemSettings } from './settings-actions'
import { getInitials } from '@/lib/utils'

export async function getLeadsMini(search?: string) {
    const leads = await prisma.lead.findMany({
        where: search ? {
            OR: [
                { firstName: { contains: search, mode: 'insensitive' as any } },
                { lastName: { contains: search, mode: 'insensitive' as any } },
                { email: { contains: search, mode: 'insensitive' as any } },
            ]
        } : {},
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { updatedAt: 'desc' },
        take: 30 // Aumentato un po' ma limitato
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
    
    // Mappatura esaustiva per coprire ogni possibile variazione di case dal DB
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
        if (lower === 'creatorphone') mapped.creatorPhone = val;
        if (lower === 'sentat') mapped.sentAt = val;
        if (lower === 'notes') mapped.notes = val;
        if (lower === 'status') mapped.status = val;
        if (lower === 'number') mapped.number = val;
    });

    return mapped;
}

export async function getQuotes(search?: string) {
    const quotes = await prisma.quote.findMany({
        where: search ? {
            OR: [
                { lead: { firstName: { contains: search, mode: 'insensitive' as any } } },
                { lead: { lastName: { contains: search, mode: 'insensitive' as any } } },
                { lead: { email: { contains: search, mode: 'insensitive' as any } } },
                { number: isNaN(parseInt(search)) ? undefined : parseInt(search) }
            ]
        } : {},
        include: {
            lead: true,
            items: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limitiamo per velocità
    });
    return serializePrisma(quotes);
}

export async function createQuote(leadId: string) {
    // 1. Recupero metadati in parallelo per velocità estrema
    const [userResult, settings, maxResult, currentLead] = await Promise.all([
        getCurrentUser(),
        getCompanySettings(),
        prisma.quote.aggregate({ _max: { number: true } }),
        prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, notesInternal: true } })
    ]);
    
    const nextNumber = (maxResult._max.number || 0) + 1;
    const creatorName = userResult?.name || settings?.referente || "Luca Vitale";
    const creatorPhone = userResult?.phone || ""; // Priorità al cellulare dell'operatore loggato
    const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    const initials = getInitials(creatorName);
    const systemNote = `[Sistema - ${initials} - ${timestamp}]: Passato a stato Preventivo. Creato nuovo preventivo (automatico)\n\n`;

    // 2. Operazioni DB raggruppate in parallelo
    try {
        await prisma.$executeRawUnsafe(
            `INSERT INTO "Quote" (id, "number", "leadId", status, "createdBy", "creatorPhone", "totalAmount", "discountTotal", "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            quoteId, nextNumber, leadId, 'BOZZA', creatorName, creatorPhone, 0, 0
        );
    } catch (e: any) {
        console.warn("Fallback insert Quote (missing columns?):", e.message);
        // Fallback simplified version without metadata columns that might be missing
        await prisma.$executeRawUnsafe(
            `INSERT INTO "Quote" (id, "number", "leadId", status, "totalAmount", "discountTotal", "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            quoteId, nextNumber, leadId, 'BOZZA', 0, 0
        );
    }

    await Promise.all([
        prisma.lead.update({
            where: { id: leadId },
            data: {
                stage: 'PREVENTIVO',
                lastStatus: 'PREVENTIVO',
                lastStatusAt: new Date(),
                notesInternal: systemNote + (currentLead?.notesInternal || "")
            }
        }),
        prisma.activity.create({
            data: {
                leadId,
                type: 'QUOTE',
                notes: "Creato nuovo preventivo (automatico)"
            }
        })
    ]);

    // 3. Revalidazione singola per rotte multiple (dove possibile)
    // Non attendiamo la revalidazione se non critico per la risposta immediata
    const reval = async () => {
        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/quotes');
        revalidatePath('/activities');
    };
    reval();
    
    return serializePrisma({ 
        id: quoteId, 
        number: nextNumber, 
        leadId, 
        status: 'BOZZA', 
        createdBy: creatorName, 
        creatorPhone 
    });
}

export async function getQuote(id: string) {
    try {
        // 1. Prisma fetch (relazioni incluse)
        let quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                lead: true,
                items: { orderBy: { id: 'asc' } }
            }
        }) as any;

        // 2. Fallback Raw SQL se Prisma fallisce (raro, ma utile in migrazione)
        if (!quote) {
            const quoteResults: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "Quote" WHERE id = $1`, id);
            if (quoteResults.length === 0) return null;
            
            quote = mapRawToPrisma(quoteResults[0]);
            const rawItems: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "QuoteItem" WHERE "quoteId" = $1 ORDER BY "id" ASC`, id);
            quote.items = rawItems.map(item => mapRawToPrisma(item));
            
            const lead = await prisma.lead.findUnique({ where: { id: quote.leadId } });
            quote.lead = lead;
        }

        // 3. Recupero settings in parallelo
        const [settings, systemSettings] = await Promise.all([
            getCompanySettings(),
            getSystemSettings()
        ]);
        
        return serializePrisma({
            ...quote,
            companySettings: settings,
            systemSettings: systemSettings
        });
    } catch (error) {
        console.error("Error in getQuote:", error);
        return null;
    }
}

export async function deleteQuote(id: string, leadId?: string) {
    // Usiamo il raggruppamento delle operazioni per massimizzare la velocità
    await prisma.$executeRawUnsafe(`DELETE FROM "Quote" WHERE id = $1`, id);
    
    // Revalidazioni in parallelo senza bloccare l'esecuzione se possibile
    const paths = ['/quotes', '/activities', '/finance', '/kanban'];
    if (leadId) paths.push(`/leads/${leadId}`);
    
    await Promise.all(paths.map(path => {
        try { return revalidatePath(path); } catch { return null; }
    }));
    
    return { success: true };
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
        console.warn("Fallback insert QuoteItem (retry without metadata):", e.message);
        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO "QuoteItem" (id, "quoteId", description, quantity, "unitPrice", "vatRate", "totalPrice") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                id, quoteId, data.description, data.quantity, data.unitPrice, data.vatRate, totalPrice
            );
        } catch (e2: any) {
            console.error("Critical insert QuoteItem failure:", e2.message);
            // Last resort: basic insert
            await prisma.$executeRawUnsafe(
                `INSERT INTO "QuoteItem" (id, "quoteId", description, quantity, "unitPrice", "totalPrice") 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                id, quoteId, data.description, data.quantity, data.unitPrice, totalPrice
            );
        }
    }

    await updateQuoteTotal(quoteId);
    return getQuote(quoteId);
}

export async function updateQuoteItem(itemId: string, quoteId: string, data: { description: string, quantity: number, originalPrice?: number, unitPrice: number, discount?: number, vatRate: number }) {
    const totalPrice = data.quantity * data.unitPrice;

    // Eseguiamo l'aggiornamento e il ricalcolo del totale in parallelo/sequenza veloce senza revalidate ridondanti
    await (prisma as any).quoteItem.update({
        where: { id: itemId },
        data: {
            description: data.description,
            quantity: data.quantity,
            originalPrice: data.originalPrice || data.unitPrice,
            unitPrice: data.unitPrice,
            discount: data.discount || 0,
            vatRate: data.vatRate || 22,
            totalPrice: totalPrice
        }
    });

    // Aggiornamento totale atomico
    await updateQuoteTotal(quoteId);
    
    // Restituiamo il preventivo aggiornato direttamente per evitare una seconda chiamata fetch
    return getQuote(quoteId);
}
泛指基础:1
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

        const fileName = `PRV${quote.number}-${(quote.lead?.firstName || 'CLIENTE').toUpperCase()}_${(quote.lead?.lastName || '').toUpperCase()}-${new Date().toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'}).replace('/', '_')}.pdf`;

        await sendEmail({
            to: quote.lead.email,
            subject: `Preventivo #${quote.number} - PRETTY LITTLE SRL`,
            body: `Gentile ${quote.lead.firstName},\n\nin allegato il preventivo #${quote.number} richiesto.\n\nCordiali saluti,\n${quote.createdBy || 'PRETTY LITTLE SRL'}`,
            attachment: {
                filename: fileName,
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
    const isAccepted = status === 'ACCETTATO' || status === 'ACCEPTED';
    
    // Eseguiamo tutto in parallelo per la massima velocità
    await Promise.all([
        prisma.$executeRawUnsafe(
            `UPDATE "Quote" SET "status" = $1 WHERE id = $2`,
            status, id
        ),
        prisma.activity.create({
            data: {
                leadId,
                type: 'SYSTEM',
                notes: `Stato preventivo aggiornato a: ${status}`
            }
        }),
        prisma.lead.update({
            where: { id: leadId },
            data: { 
                updatedAt: new Date(),
                // Se accettato, il lead diventa VINTO e sparisce dalle attività
                ...(isAccepted ? { stage: 'VINTO', lastStatus: 'CONFERMATO' } : {})
            }
        })
    ]);

    // Revalidazione parallela
    revalidatePath('/quotes');
    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/finance');
    revalidatePath('/kanban');
    
    return { success: true };
}

async function updateQuoteTotal(quoteId: string) {
    // Calcolo del totale in un'unica query SQL performante
    await prisma.$executeRawUnsafe(`
        UPDATE "Quote"
        SET "totalAmount" = GREATEST(0, (
            SELECT COALESCE(SUM("totalPrice"), 0)
            FROM "QuoteItem"
            WHERE "quoteId" = "Quote".id
        ) - COALESCE("discountTotal", 0))
        WHERE id = $1
    `, quoteId);
}
