'use server'

import fs from 'fs'
import path from 'path'
import { writeFile, mkdir, readdir, unlink, rmdir } from 'fs/promises'

const PRESENTATION_ROOT = path.join(process.cwd(), 'public', 'presentation');

async function ensureRoot() {
    try {
        if (!fs.existsSync(PRESENTATION_ROOT)) {
            console.log("Creating root:", PRESENTATION_ROOT);
            await mkdir(PRESENTATION_ROOT, { recursive: true });
        }
    } catch (e) {
        console.error("Critical: Cannot create presentation root", e);
    }
}

export async function getFiles(currentPath: string = '') {
    try {
        await ensureRoot();
        const fullPath = path.join(PRESENTATION_ROOT, currentPath);
        
        console.log("Fetching files from:", fullPath);

        if (!fs.existsSync(fullPath)) {
            console.warn("Path does not exist:", fullPath);
            return [];
        }

        const entries = await readdir(fullPath, { withFileTypes: true });
        
        const results = entries
            .filter(entry => entry.name !== '.DS_Store' && entry.name !== 'test.txt')
            .map(entry => ({
                name: entry.name,
                isDir: entry.isDirectory(),
                size: 0,
                ext: path.extname(entry.name).toLowerCase(),
                url: `/presentation/${currentPath ? currentPath + '/' : ''}${entry.name}`
            })).sort((a, b) => b.isDir ? 1 : -1);

        console.log(`Found ${results.length} items`);
        return results;
    } catch (error) {
        console.error("getFiles error detail:", error);
        throw new Error("Errore durante la lettura della cartella");
    }
}

export async function createFolder(folderName: string, currentPath: string = '') {
    try {
        const newPath = path.join(PRESENTATION_ROOT, currentPath, folderName);
        console.log("Creating folder:", newPath);
        if (!fs.existsSync(newPath)) {
            await mkdir(newPath, { recursive: true });
            return { success: true };
        }
        return { success: false, error: "Cartella già esistente" };
    } catch (error) {
        console.error("createFolder error:", error);
        return { success: false, error: "Errore permessi server" };
    }
}

export async function uploadFile(formData: FormData, currentPath: string = '') {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("File mancante");

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const targetDir = path.join(PRESENTATION_ROOT, currentPath);
        const targetPath = path.join(targetDir, file.name);

        console.log("Uploading file to:", targetPath);
        await writeFile(targetPath, buffer);
        return { success: true };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Errore permessi disco" };
    }
}

export async function deleteEntry(name: string, currentPath: string = '', isDir: boolean = false) {
    try {
        const targetPath = path.join(PRESENTATION_ROOT, currentPath, name);
        console.log("Deleting:", targetPath);
        if (isDir) {
            await rmdir(targetPath, { recursive: true });
        } else {
            await unlink(targetPath);
        }
        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error: "Errore eliminazione" };
    }
}
