'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";

/**
 * Recupera tutti i lead che hanno almeno un preventivo ACCETTATO.
 * Questi sono i nostri "Deal" in fase di produzione.
 */
export async function getDeals() {
    const deals = await prisma.lead.findMany({
        where: {
            quotes: {
                some: {
                    status: 'ACCETTATO'
                }
            }
        },
        include: {
            deal: true,
            quotes: {
                where: { status: 'ACCETTATO' },
                take: 1
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Calcolo dell'andamento (0-100%)
    const dealsWithProgress = deals.map(lead => {
        const deal = lead.deal;
        let progress = 0;
        
        if (deal) {
            // Definiamo i campi chiave che determinano l'andamento
            const keyFields = [
                deal.numGuests, deal.numFavors, deal.arrivalTime, deal.endTime,
                deal.favor1_colors, deal.favor1_graphics, deal.favor1_scents,
                deal.pack1_ribbon, deal.acc1_product
            ];
            
            const filledFields = keyFields.filter(f => f && f.trim() !== "").length;
            progress = Math.round((filledFields / keyFields.length) * 100);
        }

        return {
            ...lead,
            progress
        };
    });

    return serializePrisma(dealsWithProgress);
}

/**
 * Recupera i dettagli di un singolo Deal o lo crea se non esiste
 */
export async function getDealById(leadId: string) {
    let deal = await prisma.deal.findUnique({
        where: { leadId }
    });

    if (!deal) {
        // Se non esiste lo creiamo (fase di inizializzazione Deal)
        deal = await prisma.deal.create({
            data: { leadId }
        });
    }

    return serializePrisma(deal);
}

/**
 * Aggiorna i dati della scheda tecnica
 */
export async function updateDeal(leadId: string, data: any) {
    try {
        const updated = await prisma.deal.update({
            where: { leadId },
            data
        });
        
        revalidatePath(`/deals/${leadId}`);
        revalidatePath('/deals');
        return { success: true, data: serializePrisma(updated) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
