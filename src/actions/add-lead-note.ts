'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addLeadNoteAction(leadId: string, newNote: string) {
    if (!newNote || newNote.trim().length === 0) return { success: false, error: "Nota vuota" };

    try {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { notesInternal: true }
        });

        const currentNotes = lead?.notesInternal || "";
        const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        
        // Newest note at the TOP
        const noteWithSignature = `[Luca V. - ${timestamp}]: ${newNote.trim()}\n\n`;
        
        const updatedNotes = noteWithSignature + currentNotes;

        await prisma.lead.update({
            where: { id: leadId },
            data: { notesInternal: updatedNotes }
        });

        revalidatePath(`/leads/${leadId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to add lead note:", error);
        return { success: false, error: "Errore durante il salvataggio della nota" };
    }
}
