'use server'

import fs from 'fs'
import path from 'path'
import { writeFile, mkdir, readdir, unlink, rmdir } from 'fs/promises'

const PRESENTATION_ROOT = path.join(process.cwd(), 'public', 'presentation');

// Assicura che la cartella root esista
async function ensureRoot() {
    try {
        if (!fs.existsSync(PRESENTATION_ROOT)) {
            await mkdir(PRESENTATION_ROOT, { recursive: true });
        }
    } catch (e) {
        console.error("Critical: Cannot create presentation root", e);
    }
}

/**
 * Ottiene la lista di file e cartelle
 */
export async function getFiles(currentPath: string = '') {
    try {
        await ensureRoot();
        const fullPath = path.join(PRESENTATION_ROOT, currentPath);
        
        if (!fs.existsSync(fullPath)) return [];

        const entries = await readdir(fullPath, { withFileTypes: true });
        
        return entries.map(entry => ({
            name: entry.name,
            isDir: entry.isDirectory(),
            size: 0,
            ext: path.extname(entry.name).toLowerCase(),
            url: `/presentation/${currentPath ? currentPath + '/' : ''}${entry.name}`
        })).sort((a, b) => b.isDir ? 1 : -1);
    } catch (error) {
        console.error("getFiles error:", error);
        return [];
    }
}

/**
 * Crea una nuova cartella
 */
export async function createFolder(folderName: string, currentPath: string = '') {
    try {
        await ensureRoot();
        const newPath = path.join(PRESENTATION_ROOT, currentPath, folderName);
        if (!fs.existsSync(newPath)) {
            await mkdir(newPath, { recursive: true });
            return { success: true };
        }
        return { success: false, error: "Cartella già esistente" };
    } catch (error) {
        return { success: false, error: "Errore permessi server" };
    }
}

/**
 * Carica un file
 */
export async function uploadFile(formData: FormData, currentPath: string = '') {
    try {
        await ensureRoot();
        const file = formData.get('file') as File;
        if (!file) throw new Error("File mancante");

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const targetDir = path.join(PRESENTATION_ROOT, currentPath);
        const targetPath = path.join(targetDir, file.name);

        await writeFile(targetPath, buffer);
        return { success: true };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Errore permessi disco" };
    }
}

/**
 * Elimina un file o cartella
 */
export async function deleteEntry(name: string, currentPath: string = '', isDir: boolean = false) {
    try {
        const targetPath = path.join(PRESENTATION_ROOT, currentPath, name);
        if (isDir) {
            await rmdir(targetPath, { recursive: true });
        } else {
            await unlink(targetPath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: "Errore eliminazione" };
    }
}
