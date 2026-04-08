'use server'

import prisma from "@/lib/prisma"

export async function checkTables() {
    try {
        const tables = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tabelle presenti nel DB:", tables);
        return tables;
    } catch (e) {
        console.error("Errore nel controllo tabelle:", e);
        return [];
    }
}
