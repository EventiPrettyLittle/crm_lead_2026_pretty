'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

export async function updateLeadQuickAction(
    leadId: string,
    type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment',
    data: {
        notes?: string;
        nextFollowup?: Date;
        appointmentDate?: string;
        appointmentType?: string;
        title?: string;
    }
) {
    try {
        const now = new Date();
        const stageMap: Record<string, string> = {
            'contacted': 'CONTATTATO',
            'no-answer': 'NON_RISPONDE',
            'preventivo': 'PREVENTIVO',
            'cancelled': 'CANCELLATO',
            'appointment': 'APPUNTAMENTO'
        };
        const newStage = stageMap[type];

        // 1. UPDATE STATO VIA SQL RAW (ZERO ERRORI)
        await prisma.$executeRawUnsafe(
            `UPDATE "Lead" SET 
             stage = $1, 
             "lastStatus" = $2, 
             "lastStatusAt" = $3, 
             "contactedAt" = $4, 
             "nextFollowupAt" = $5, 
             "updatedAt" = $6 
             WHERE id = $7`,
            newStage, newStage, now, now, data.nextFollowup || null, now, leadId
        );

        // 2. CREAZIONE ATTIVITÁ VIA SQL RAW
        const activityType = type === 'contacted' ? 'CALL' : type === 'no-answer' ? 'RICHIAMO' : 'SYSTEM';
        const activityId = Math.random().toString(36).substring(7);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "Activity" (id, "leadId", type, notes, "nextFollowupAt", "createdAt") 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            activityId, leadId, activityType, `Stato cambiato in ${newStage}. ${data.notes || ''}`, data.nextFollowup || null, now
        );

        revalidatePath(`/leads/${leadId}`);
        revalidatePath('/leads');
        revalidatePath('/');
        
        return { success: true };
    } catch (error: any) {
        console.error("Critical SQL Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createManualLead(data: any) {
    try {
        const id = Math.random().toString(36).substring(7);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "Lead" (id, "firstName", "lastName", email, "phoneRaw", stage, "updatedAt", "createdAt") 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            id, data.firstName || null, data.lastName || null, data.email || null, data.phone || null, 'NUOVO'
        );
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateLeadDetails(id: string, data: any) {
    try {
        // Forza creazione colonna referents se manca durante il save
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "referents" TEXT;`); } catch(e){}

        // Mappa campi virtuali del frontend alle loro controparti reali del DB
        const dbData: any = { ...data };
        if ('phone' in dbData) {
            dbData.phoneRaw = dbData.phone;
            delete dbData.phone;
        }

        // Sanitizzazione: converti le stringhe vuote in null (specialmente per le date/numeri)
        for (const k of Object.keys(dbData)) {
            if (dbData[k] === '') {
                dbData[k] = null;
            }
        }

        // Costruiamo una query SQL dinamica per evitare crash Prisma sui campi
        const keys = Object.keys(dbData).filter(k => dbData[k] !== undefined);
        const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const values = keys.map(key => dbData[key]);

        
        await prisma.$executeRawUnsafe(
            `UPDATE "Lead" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1}`,

            ...values, id
        );

        revalidatePath(`/leads/${id}`);
        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) { 
        console.error("Manual Update Error:", error);
        return { success: false, error: error.message }; 
    }
}
