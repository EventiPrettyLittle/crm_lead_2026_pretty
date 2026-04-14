'use server'

import { Quote } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createActivity } from './lead-detail'
import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

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
    // Generate next number logic (simplified)
    const count = await prisma.quote.count();
    const number = count + 1;

    const quote = await prisma.quote.create({
        data: {
            leadId,
            number,
            status: 'BOZZA',
            items: {
                create: [] // Start empty or with defaults
            }
        }
    });

    revalidatePath(`/leads/${leadId}`);
    return serializePrisma(quote);
}

export async function getQuote(id: string) {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            items: true,
            lead: true
        }
    });
    return serializePrisma(quote);
}

export async function deleteQuote(id: string, leadId: string) {
    await prisma.quote.delete({
        where: { id }
    });
    revalidatePath(`/leads/${leadId}`);
}

export async function addItemToQuote(quoteId: string, data: { description: string, quantity: number, unitPrice: number, vatRate: number }) {
    const totalPrice = data.quantity * data.unitPrice;

    await prisma.quoteItem.create({
        data: {
            quoteId,
            ...data,
            totalPrice
        }
    });

    await updateQuoteTotal(quoteId);
    revalidatePath('/quotes');
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (quote) {
        revalidatePath(`/leads/${quote.leadId}`);
    }
}

export async function updateQuoteDetails(id: string, data: { paymentMethod?: string, discountTotal?: number, notes?: string }) {
    await prisma.quote.update({
        where: { id },
        data: data as any
    });

    await updateQuoteTotal(id);
    revalidatePath('/quotes');
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (quote) {
        revalidatePath(`/leads/${quote.leadId}`);
    }
}

export async function deleteQuoteItem(itemId: string, quoteId: string) {
    await prisma.quoteItem.delete({
        where: { id: itemId }
    });

    await updateQuoteTotal(quoteId);
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (quote) {
        revalidatePath(`/leads/${quote.leadId}`);
    }
}

export async function sendQuoteByEmail(quoteId: string) {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { lead: true, items: true }
    });

    if (!quote || !quote.lead.email) {
        return { success: false, error: "Quote or lead email not found" };
    }

    const { sendEmail } = await import('@/lib/email');

    await sendEmail({
        to: quote.lead.email,
        subject: `Preventivo #${quote.number} - CRM Platform`,
        body: `Gentile ${quote.lead.firstName},\n\nin allegato il preventivo richiesto.\n\nCordiali saluti,\nCRM Platform`,
        // In a real scenario, we would generate the PDF buffer here or use a link
    });

    return { success: true };
}

async function updateQuoteTotal(quoteId: string) {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true }
    });
    if (!quote) return;

    const itemsTotal = quote.items.reduce((acc, item) => acc + Number(item.totalPrice), 0);
    const quoteData = quote as any;
    const finalTotal = itemsTotal - Number(quoteData.discountTotal || 0);

    await prisma.quote.update({
        where: { id: quoteId },
        data: { totalAmount: Math.max(0, finalTotal) }
    });
}
