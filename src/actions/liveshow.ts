'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";

/**
 * Recupera tutti gli invitati di un determinato Deal
 */
export async function getGuests(dealId: string) {
    try {
        const guests = await prisma.guest.findMany({
            where: { dealId },
            orderBy: { name: 'asc' }
        });
        return serializePrisma(guests);
    } catch (error: any) {
        console.error("Error fetching guests:", error);
        return [];
    }
}

/**
 * Aggiunge un nuovo invitato
 */
export async function addGuest(dealId: string, name: string) {
    try {
        const guest = await prisma.guest.create({
            data: {
                dealId,
                name: name.toUpperCase(),
                tags: [],
                isPresent: true
            }
        });
        revalidatePath(`/deals/${dealId}`);
        return { success: true, data: serializePrisma(guest) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Aggiorna un invitato (tag, selezioni, ecc.)
 */
export async function updateGuest(guestId: string, data: any) {
    try {
        const updated = await prisma.guest.update({
            where: { id: guestId },
            data
        });
        revalidatePath('/deals');
        return { success: true, data: serializePrisma(updated) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Elimina un invitato
 */
export async function deleteGuest(guestId: string, dealId: string) {
    try {
        await prisma.guest.delete({
            where: { id: guestId }
        });
        revalidatePath(`/deals/${dealId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Toggle presenza invitato
 */
export async function togglePresence(guestId: string, isPresent: boolean) {
    try {
        const updated = await prisma.guest.update({
            where: { id: guestId },
            data: { isPresent }
        });
        return { success: true, data: serializePrisma(updated) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Recupera i dati del Deal includendo gli invitati
 */
export async function getDealWithGuests(leadId: string) {
    try {
        const deal = await prisma.deal.findUnique({
            where: { leadId },
            include: {
                guests: true,
                lead: {
                    select: {
                        firstName: true,
                        lastName: true,
                        locationName: true,
                        eventDate: true,
                        referents: true
                    }
                }
            }
        });

        if (!deal) return null;

        // Cerchiamo anche il preventivo accettato
        const acceptedQuote = await prisma.quote.findFirst({
            where: { 
                leadId,
                status: 'ACCETTATO'
            },
            include: {
                items: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        return serializePrisma({
            ...deal,
            acceptedQuote
        });
    } catch (error: any) {
        console.error("Error fetching deal with guests:", error);
        return null;
    }
}

/**
 * Aggiunge più invitati in blocco
 */
export async function bulkAddGuests(dealId: string, guestsData: { name: string, tag?: string }[]) {
    try {
        const results = [];
        for (const data of guestsData) {
            const guest = await prisma.guest.create({
                data: {
                    dealId,
                    name: data.name.toUpperCase(),
                    tags: data.tag ? [data.tag.toUpperCase()] : [],
                    isPresent: true
                }
            });
            results.push(guest);
        }
        revalidatePath(`/deals/${dealId}`);
        return { success: true, count: results.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
