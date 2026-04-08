'use server'

import { Lead } from '@prisma/client'
import prisma from "@/lib/prisma"
import { ParsedLead } from '@/lib/import-utils'
import { revalidatePath } from 'next/cache'



export type ImportResult = {
    success: number;
    errors: number;
    message?: string;
}

export async function importLeadsAction(leads: ParsedLead[]): Promise<ImportResult> {
    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
        if (!lead.externalId) {
            errorCount++;
            continue;
        }

        try {
            const existing = await prisma.lead.findUnique({
                where: { externalId: lead.externalId }
            });

            if (existing) {
                await prisma.lead.update({
                    where: { id: existing.id },
                    data: {
                        leadCreatedAt: lead.leadCreatedAt,
                        countryCode: lead.countryCode,
                        eventType: lead.eventType,
                        phoneRaw: lead.phoneRaw,
                        email: lead.email,
                        preferredContactTime: lead.preferredContactTime,
                        // @ts-ignore
                        guestsCount: lead.guestsCount,
                    }
                });
            } else {
                await prisma.lead.create({
                    data: {
                        externalId: lead.externalId,
                        leadCreatedAt: lead.leadCreatedAt,
                        countryCode: lead.countryCode,
                        eventType: lead.eventType,
                        // @ts-ignore
                        guestsCount: lead.guestsCount,
                        productInterest: lead.productInterest,
                        eventDate: lead.eventDate,
                        eventLocation: lead.eventLocation,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        phoneRaw: lead.phoneRaw,
                        email: lead.email,
                        preferredContactTime: lead.preferredContactTime,
                        stage: 'NUOVO',
                    }
                });
            }
            successCount++;
        } catch (error) {
            console.error(`Error importing lead ${lead.externalId}:`, error);
            errorCount++;
        }
    }

    revalidatePath('/leads');
    return {
        success: successCount,
        errors: errorCount,
        message: `Import completed. Success: ${successCount}, Errors: ${errorCount}`
    };
}

import { serializePrisma } from "@/lib/serialize"

export async function getLeads() {
    const leads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return serializePrisma(leads);
}

export async function searchLeads(query: string) {
    if (!query || query.length < 2) return [];
    const leads = await prisma.lead.findMany({
        where: {
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    return serializePrisma(leads);
}

export async function updateLeadStage(leadId: string, newStage: string) {
    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { stage: newStage }
        });
        revalidatePath('/leads');
        return { success: true };
    } catch (error) {
        console.error("Failed to update lead stage:", error);
        return { success: false, error };
    }
}
import { cookies } from 'next/headers'
import { getGoogleSheetsClient } from '@/lib/google-auth'
import { mapRowToLead } from '@/lib/import-utils'

export async function syncLeadsFromGoogleSheet(url: string): Promise<ImportResult> {
    const cookieStore = await cookies();
    // Use the updated generic google_tokens cookie
    let tokensCookie = cookieStore.get('google_tokens') || cookieStore.get('google_calendar_tokens');

    if (!tokensCookie) {
        return { success: 0, errors: 1, message: "Account Google non collegato. Vai al Calendario o Sync per collegarlo." };
    }

    try {
        // Robust Extraction of Spreadsheet ID from URL
        let spreadsheetId = url;
        if (url.includes("/d/")) {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match) spreadsheetId = match[1];
        } else if (url.includes("id=")) {
            const match = url.match(/id=([a-zA-Z0-9-_]+)/);
            if (match) spreadsheetId = match[1];
        }

        if (!spreadsheetId || spreadsheetId.length < 20) {
            return { success: 0, errors: 1, message: "URL non valido. Assicurati di copiare tutto l'indirizzo del foglio Google." };
        }

        console.log("Syncing from Spreadsheet ID:", spreadsheetId);
        const tokens = JSON.parse(tokensCookie.value);
        const sheets = getGoogleSheetsClient(tokens);

        // Get a large range to ensure we cover row 637 and beyond
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A1:Z5000', 
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return { success: 0, errors: 0, message: "Nessun dato trovato nel foglio." };
        }

        // Headers are typically on the first row
        const headers = rows[0].map(h => String(h).trim());
        console.log("Headers found:", headers);
        
        // Use data starting from row 637 (index 636)
        // If the sheet has fewer rows, this will handle it gracefully
        const dataRows = rows.slice(636); 

        if (dataRows.length === 0) {
            return { success: 0, errors: 0, message: "Nessun dato trovato a partire dalla riga 637." };
        }

        const parsedLeads = dataRows.map(row => {
            const rowObj: Record<string, any> = {};
            headers.forEach((header, index) => {
                rowObj[header] = row[index];
            });
            return mapRowToLead(rowObj);
        }).filter(l => l.externalId);

        if (parsedLeads.length === 0) {
            console.error("No valid leads. Headers found:", headers);
            return { success: 0, errors: 0, message: "Nessun lead valido trovato. Verifica che la colonna 'Email' sia presente e popolata." };
        }

        return await importLeadsAction(parsedLeads);
    } catch (error: any) {
        console.error("Sheets sync error:", error);
        return { success: 0, errors: 1, message: error.message || "Failed to sync from Google Sheets." };
    }
}

export async function deleteAllLeads() {
    try {
        await prisma.lead.deleteMany();
        revalidatePath('/leads');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete all leads:", error);
        return { success: false, error };
    }
}

export async function deleteLead(id: string) {
    try {
        await prisma.lead.delete({
            where: { id }
        });
        revalidatePath('/leads');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete lead:", error);
        return { success: false, error };
    }
}
