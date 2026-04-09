'use server'

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const SETTINGS_PATH = path.join(process.cwd(), 'src/data/settings.json');

export async function getSystemSettings() {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) {
            return { logoUrl: '', logoWidth: 150 };
        }
        const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading settings:', error);
        return { logoUrl: '', logoWidth: 150 };
    }
}

export async function updateSystemSettings(settings: { logoUrl?: string; logoWidth?: number }) {
    try {
        const current = await getSystemSettings();
        const updated = { ...current, ...settings };
        
        // Assicuriamoci che la cartella esista
        const dir = path.dirname(SETTINGS_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
        revalidatePath('/'); // Forza l'aggiornamento di tutta l'app (per il logo nella sidebar)
        return { success: true };
    } catch (error) {
        console.error('Error updating settings:', error);
        return { success: false, error: 'Errore nel salvataggio' };
    }
}
