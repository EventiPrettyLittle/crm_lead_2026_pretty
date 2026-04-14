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
                        guestsCount: lead.guestsCount,
                        productInterest: lead.productInterest,
                        eventDate: lead.eventDate,
                        eventLocation: lead.eventLocation,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        phoneRaw: lead.phoneRaw,
                        email: lead.email,
                        preferredContactTime: lead.preferredContactTime,
                    }
                });
            } else {
                await prisma.lead.create({
                    data: {
                        externalId: lead.externalId,
                        leadCreatedAt: lead.leadCreatedAt,
                        countryCode: lead.countryCode,
                        eventType: lead.eventType,
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

export async function syncLeadsFromGoogleSheet(spreadsheetId: string): Promise<ImportResult> {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('google_calendar_tokens');

    if (!tokensCookie) {
        return { success: 0, errors: 1, message: "Google account not connected." };
    }

    try {
        const tokens = JSON.parse(tokensCookie.value);
        const sheets = getGoogleSheetsClient(tokens);

        // Get the values from the first sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A1:Z100', // Simplified range
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return { success: 0, errors: 0, message: "No data found in spreadsheet." };
        }

        const headers = rows[0].map(h => String(h).trim());
        const dataRows = rows.slice(1);

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
