'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";

/**
 * Recupera tutti i lead che hanno almeno un preventivo ACCETTATO.
 * Questi sono i nostri "Deal" in fase di produzione.
 */
export async function getDeals() {
    const acceptedQuotes = await prisma.quote.findMany({
        where: {
            status: 'ACCETTATO'
        },
        include: {
            items: true,
            lead: {
                include: {
                    deal: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // AUTO-INIT LOGIC: Se un deal non esiste o non ha la deliveryType, inizializziamo tutto nel database
    for (const quote of acceptedQuotes) {
        const lead = quote.lead;
        let deal = lead?.deal;
        
        const hasLiveShow = (quote.items || []).some((item: any) => 
            (item.description || item.name || "").toLowerCase().includes("live show")
        );
        const defaultType = hasLiveShow ? 'LIVE SHOW' : 'CONSEGNA';

        if (!deal) {
            // CREAZIONE AUTOMATICA: Il record Deal non esiste proprio
            const newDeal = await prisma.deal.create({
                data: { 
                    leadId: quote.leadId,
                    deliveryType: defaultType
                }
            });
            // Aggiorniamo l'oggetto in memoria per il calcolo successivo
            quote.lead.deal = newDeal;
        } else if (!deal.deliveryType) {
            // AGGIORNAMENTO AUTOMATICO: Esiste ma è vuoto
            await prisma.deal.update({
                where: { id: deal.id },
                data: { deliveryType: defaultType }
            });
            deal.deliveryType = defaultType;
        }
    }

    // Calcolo dell'andamento (0-100%)
    const dealsWithProgress = acceptedQuotes.map(quote => {
        const lead = quote.lead;
        const deal = lead?.deal;
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
            id: lead?.id || quote.leadId,
            progress,
            acceptedQuote: quote // Passiamo anche il riferimento al preventivo specifico
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

    // Cerchiamo anche il preventivo accettato associato con i suoi prodotti
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
}

/**
 * Aggiorna i dati della scheda tecnica
 */
export async function updateDeal(leadId: string, data: any) {
    try {
        // Rimuoviamo campi che non devono essere passati nel blocco 'data' di update
        const { id, leadId: lId, createdAt, updatedAt, ...cleanData } = data;

        const updated = await prisma.deal.update({
            where: { leadId },
            data: cleanData
        });
        
        revalidatePath(`/deals/${leadId}`);
        revalidatePath('/deals');
        return { success: true, data: serializePrisma(updated) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
