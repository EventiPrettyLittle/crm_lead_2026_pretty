'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

// Lista email Super Admin autorizzati
const SUPER_ADMIN_EMAILS = [
    'eventiprettylittle@gmail.com',
    'lucavitale88@gmail.com',
    'maria.vitale@prettylittle.it'
];

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const userCookie = cookieStore.get('PLATINUM_AUTH_SESSION');
        
        if (!userCookie || !userCookie.value) return null;
        
        let session;
        try {
            session = JSON.parse(userCookie.value);
        } catch (e) {
            return null;
        }

        if (!session || !session.email) return null;
        
        const SUPER_ADMINS = [
            'eventiprettylittle@gmail.com',
            'lucavitale88@gmail.com',
            'maria.vitale@prettylittle.it',
            'lucavitale88@gmail.com'
        ];
        
        const isSuperAdmin = SUPER_ADMINS.some(e => e.toLowerCase() === session.email.toLowerCase());
        
        return {
            ...session,
            role: isSuperAdmin ? 'SUPER_ADMIN' : (session.role || 'OPERATOR')
        };
    } catch (e) {
        return null;
    }
}

export async function loginWithCredentials(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        // Cerca l'utente nel database
        const users: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = $1`, email);
        const user = users[0];

        if (!user) {
            return { success: false, error: "Utente non trovato" };
        }

        // Verifica password (semplificata per ora, in produzione usiamo bcrypt)
        // Se la password nel DB è nulla (utente Google), non può accedere via mail
        if (!user.password) {
            return { success: false, error: "Usa l'accesso Google per questo account" };
        }

        if (user.password !== password) {
            return { success: false, error: "Password errata" };
        }

        // Crea sessione
        const userData = {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            image: null
        };

        const cookieStore = await cookies();
        cookieStore.set('PLATINUM_AUTH_SESSION', JSON.stringify(userData), {
            httpOnly: true,
            secure: true, // Obbligatorio per HTTPS
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        });

        return { success: true };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Errore durante l'accesso" };
    }
}

export async function updateUser(data: { name?: string, password?: string, phone?: string }) {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non autorizzato" };

    try {
        if (data.name) {
            const cleanName = data.name.trim();
            await prisma.$executeRawUnsafe(`UPDATE "User" SET name = $1 WHERE email = $2`, cleanName, user.email);
            
        // Aggiorniamo il cookie con il nuovo nome
            const cookieStore = await cookies();
            const updatedUser = { ...user, name: cleanName };
            cookieStore.set('PLATINUM_AUTH_SESSION', JSON.stringify(updatedUser), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 
            });
        }

        if (data.phone !== undefined) {
            await prisma.$executeRawUnsafe(`UPDATE "User" SET phone = $1 WHERE email = $2`, data.phone, user.email);
        }
        
        if (data.password && data.password.trim() !== "") {
            await prisma.$executeRawUnsafe(`UPDATE "User" SET password = $1 WHERE email = $2`, data.password, user.email);
        }
        
        // Forza l'aggiornamento di tutta la UI
        revalidatePath('/', 'layout');
        
        return { success: true };
    } catch (e) {
        return { success: false, error: "Errore aggiornamento utente" };
    }
}

export async function getAllUsers() {
    // LOGICA DI DIAGNOSTICA: Sblocchiamo la lista per tutti temporaneamente
    // const admin = await getCurrentUser();

    try {
        // Tentativo 1: Standard Prisma (senza phone per evitare crash se il client è vecchio)
        try {
            const users = await prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true, createdAt: true } as any,
                orderBy: { createdAt: 'desc' }
            });
            if (users && users.length > 0) return serializePrisma(users);
        } catch (e) {
            console.warn("[AUTH] Tentativo 1 fallito, provo SQL grezzo...");
        }

        // Tentativo 2: Raw SQL (qui il phone non blocca il build perché è una stringa)
        const rawUsers = await prisma.$queryRawUnsafe(`SELECT id, email, name, role, phone, "createdAt" FROM "User" ORDER BY "createdAt" DESC`)
            .catch(() => prisma.$queryRawUnsafe(`SELECT id, email, name, role, phone, "createdAt" FROM public."User" ORDER BY "createdAt" DESC`))
            .catch(() => []) as any[];
            
        return rawUsers;
    } catch (e: any) {
        console.error("[AUTH ERROR] Errore getAllUsers:", e.message);
        // Ritorniamo l'errore palese per vederlo nella tabella UI
        return [{ id: 'error', name: 'ERRORE TECNICO', email: e.message, role: 'SYSTEM' }];
    }
}

export async function deleteUser(userId: string) {
    const admin = await getCurrentUser();
    if (admin?.role !== 'SUPER_ADMIN') return { success: false, error: "Non autorizzato" };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Sganciamo i lead
            await tx.lead.updateMany({
                where: { ownerId: userId },
                data: { ownerId: null }
            });

            // 2. Eliminiamo gli appuntamenti
            await tx.appointment.deleteMany({
                where: { ownerId: userId }
            });

            // 3. Eliminiamo l'utente
            await tx.user.delete({
                where: { id: userId }
            });
        });
        
        revalidatePath('/settings');
        return { success: true };
    } catch (e: any) {
        console.error("Delete Error:", e);
        // Ritorniamo l'errore completo per capire cosa succede
        return { success: false, error: e.message || "Errore sconosciuto durante l'eliminazione" };
    }
}

export async function createUser(data: { email: string, name: string, role: string, phone?: string, password?: string }) {
    const admin = await getCurrentUser();
    
    // LOGICA DI DIAGNOSTICA: Se vogliamo rimettere il blocco, usare la riga sotto
    // if (admin?.role !== 'SUPER_ADMIN') return { success: false, error: `Non autorizzato (Email rilevata: ${admin?.email || 'Nessuna'})` };

    try {
        const id = Math.random().toString(36).substring(7);
        const roleToSet = data.role || 'OPERATOR';
        await prisma.$executeRawUnsafe(
            `INSERT INTO "User" (id, email, name, role, phone, password, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            id, data.email, data.name, data.role, data.phone || null, data.password || null
        );
        revalidatePath('/settings');
        return { success: true };
    } catch (e) {
        return { success: false, error: "L'utente esiste già o errore DB" };
    }
}
