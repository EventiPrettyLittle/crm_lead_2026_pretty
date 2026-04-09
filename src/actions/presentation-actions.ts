'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

/**
 * Crea la tabella per i file di presentazione se non esiste
 */
async function ensurePresentationTable() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PresentationItem" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "type" TEXT NOT NULL, -- "FILE", "FOLDER"
                "kind" TEXT, -- "IMAGE", "VIDEO", "PDF", "OTHER"
                "url" TEXT, -- Base64 for images or Link for videos/PDFs
                "parentId" TEXT, -- For folder structure
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        // console.log("Table exists or error");
    }
}

export async function getFiles(parentId: string | null = null) {
    try {
        await ensurePresentationTable();
        const items = await (prisma as any).presentationItem.findMany({
            where: { parentId: parentId || undefined },
            orderBy: [{ type: 'desc' }, { createdAt: 'desc' }]
        });
        return serializePrisma(items);
    } catch (error) {
        console.error("getFiles error:", error);
        return [];
    }
}

export async function createFolder(name: string, parentId: string | null = null) {
    try {
        await ensurePresentationTable();
        const folder = await (prisma as any).presentationItem.create({
            data: {
                id: `folder-${Date.now()}`,
                name,
                type: 'FOLDER',
                parentId: parentId || null
            }
        });
        return { success: true, folder: serializePrisma(folder) };
    } catch (error) {
        return { success: false, error: "Errore creazione cartella" };
    }
}

export async function saveFile(data: { name: string, kind: string, url: string, parentId: string | null }) {
    try {
        await ensurePresentationTable();
        const file = await (prisma as any).presentationItem.create({
            data: {
                id: `file-${Date.now()}`,
                name: data.name,
                type: 'FILE',
                kind: data.kind,
                url: data.url,
                parentId: data.parentId || null
            }
        });
        return { success: true, file: serializePrisma(file) };
    } catch (error) {
        console.error("Save file error:", error);
        return { success: false, error: "Errore salvataggio nel database" };
    }
}

export async function deleteEntry(id: string) {
    try {
        // Se è una cartella, dovremmo cancellare ricorsivamente, 
        // ma per semplicità ora cancelliamo solo l'id selezionato
        await (prisma as any).presentationItem.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Errore eliminazione" };
    }
}
