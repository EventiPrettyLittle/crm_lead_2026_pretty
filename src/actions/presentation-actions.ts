'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"
import { revalidatePath } from "next/cache"

/**
 * Crea la tabella per i file di presentazione se non esiste via SQL puro
 */
async function ensurePresentationTable() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PresentationItem" (
                "id" TEXT PRIMARY KEY,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "kind" TEXT,
                "url" TEXT,
                "parentId" TEXT,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        // Ignora se la tabella esiste già
    }
}

export async function getFiles(parentId: string | null = null) {
    try {
        await ensurePresentationTable();
        
        // Ottimizzazione: Non recuperiamo l'URL (che può essere un pesante Base64) 
        // per gli elementi di tipo FILE-IMAGE nella lista principale.
        // Lo recupereremo on-demand per la preview.
        const items: any[] = await (parentId 
            ? prisma.$queryRawUnsafe(`SELECT id, name, "type", "kind", "parentId", "createdAt" FROM "PresentationItem" WHERE "parentId" = $1 ORDER BY "type" DESC, "name" ASC`, parentId)
            : prisma.$queryRawUnsafe(`SELECT id, name, "type", "kind", "parentId", "createdAt" FROM "PresentationItem" WHERE "parentId" IS NULL ORDER BY "type" DESC, "name" ASC`));
        
        console.log(`[PRESENTATION] Found ${items.length} items for parentId: ${parentId}`);
        
        // Se è un VIDEO o PDF, l'URL è un link leggero, quindi lo recuperiamo comunque
        // per permettere di distinguerli o usarli subito.
        // Facciamo una seconda query o integriamo nella prima (SQLite/Postgres handle this differently but raw is safer)
        for (let item of items) {
            if (item.type === 'FILE' && (item.kind === 'VIDEO' || item.kind === 'PDF')) {
                const fullItem: any = await prisma.$queryRawUnsafe(`SELECT url FROM "PresentationItem" WHERE id = $1`, item.id);
                if (fullItem && fullItem[0]) item.url = fullItem[0].url;
            }
        }
            
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
        
        revalidatePath('/presentation');
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
        
        revalidatePath('/presentation');
        return { success: true };
    } catch (error) {
        console.error("Save file error:", error);
        return { success: false, error: "Errore salvataggio nel database" };
    }
}

export async function renameEntry(id: string, newName: string) {
    try {
        await prisma.$executeRawUnsafe(
            `UPDATE "PresentationItem" SET name = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
            newName, id
        );
        revalidatePath('/presentation');
        return { success: true };
    } catch (error: any) {
        console.error("Rename error:", error);
        return { success: false, error: `Errore rinomina: ${error.message}` };
    }
}

export async function deleteEntry(id: string) {
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "PresentationItem" WHERE "parentId" = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM "PresentationItem" WHERE id = $1`, id);
        revalidatePath('/presentation');
        return { success: true };
    } catch (error: any) {
        console.error("Delete error:", error);
        return { success: false, error: `Errore eliminazione: ${error.message}` };
    }
}

export async function getFileContent(id: string) {
    try {
        const item: any = await prisma.$queryRawUnsafe(`SELECT url FROM "PresentationItem" WHERE id = $1`, id);
        if (item && item[0]) return { success: true, url: item[0].url };
        return { success: false, error: "File non trovato" };
    } catch (error) {
        console.error("getFileContent error:", error);
        return { success: false, error: "Errore nel recupero del contenuto" };
    }
}
