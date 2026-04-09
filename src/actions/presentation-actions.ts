'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

/**
 * Crea la tabella per i file di presentazione se non esiste via SQL puro
 */
async function ensurePresentationTable() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PresentationItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "kind" TEXT,
                "url" TEXT,
                "parentId" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        // Ignora se la tabella esiste già o c'è un errore non critico
    }
}

export async function getFiles(parentId: string | null = null) {
    try {
        await ensurePresentationTable();
        
        // Uso queryRaw per evitare errori di compilazione Prisma
        const items = parentId 
            ? await prisma.$queryRawUnsafe(`SELECT * FROM "PresentationItem" WHERE "parentId" = $1 ORDER BY "type" DESC, "name" ASC`, parentId)
            : await prisma.$queryRawUnsafe(`SELECT * FROM "PresentationItem" WHERE "parentId" IS NULL ORDER BY "type" DESC, "name" ASC`);
            
        return serializePrisma(items);
    } catch (error) {
        console.error("getFiles error:", error);
        return [];
    }
}

export async function createFolder(name: string, parentId: string | null = null) {
    try {
        await ensurePresentationTable();
        const id = `folder-${Date.now()}`;
        
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PresentationItem" (id, name, type, "parentId") VALUES ($1, $2, $3, $4)`,
            id, name, 'FOLDER', parentId
        );
        
        return { success: true };
    } catch (error) {
        console.error("createFolder error:", error);
        return { success: false, error: "Errore creazione cartella" };
    }
}

export async function saveFile(data: { name: string, kind: string, url: string, parentId: string | null }) {
    try {
        await ensurePresentationTable();
        const id = `file-${Date.now()}`;
        
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PresentationItem" (id, name, type, kind, url, "parentId") VALUES ($1, $2, $3, $4, $5, $6)`,
            id, data.name, 'FILE', data.kind, data.url, data.parentId
        );
        
        return { success: true };
    } catch (error) {
        console.error("Save file error:", error);
        return { success: false, error: "Errore salvataggio nel database" };
    }
}

export async function renameEntry(id: string, newName: string) {
    try {
        await prisma.$executeRawUnsafe(
            `UPDATE "PresentationItem" SET name = $1, "updatedAt" = $2 WHERE id = $3`,
            newName, new Date(), id
        );
        return { success: true };
    } catch (error) {
        console.error("Rename error:", error);
        return { success: false, error: "Errore rinomina" };
    }
}

export async function deleteEntry(id: string) {
    try {
        // Se è una cartella, eliminiamo anche i figli (gestione manuale per massima compatibilità SQL)
        await prisma.$executeRawUnsafe(`DELETE FROM "PresentationItem" WHERE "parentId" = $1`, id);
        // Poi eliminiamo l'elemento stesso
        await prisma.$executeRawUnsafe(`DELETE FROM "PresentationItem" WHERE id = $1`, id);
        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error: "Errore eliminazione" };
    }
}
