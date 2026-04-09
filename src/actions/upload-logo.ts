'use server'

import fs from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'

/**
 * Gestisce l'upload del logo salvandolo nella cartella public
 */
export async function uploadLogoAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("Nessun file caricato");

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Definiamo il percorso in public/uploads (creiamo la cartella se non esiste)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `logo-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // Restituiamo l'URL relativo per il frontend
        return { success: true, url: `/uploads/${fileName}` };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Impossibile salvare il file" };
    }
}
