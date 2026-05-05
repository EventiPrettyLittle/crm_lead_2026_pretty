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
        
        let session = null;
        if (userCookie?.value) {
            try {
                session = JSON.parse(userCookie.value);
            } catch (e) {
                console.error("[AUTH] Error parsing session cookie:", e);
            }
        }

        if (!session || !session.email) {
            // Se non c'è la sessione Platinum, proviamo a vedere se c'è quella di Google (fallback)
            const googleActive = cookieStore.get('PLATINUM_ACTIVE')?.value === 'true';
            if (!googleActive) return null;
            
            // Se PLATINUM_ACTIVE è true ma non abbiamo i dati, forziamo il logout o il ricaricamento
            return null;
        }
        
        const email = session.email.toLowerCase().trim();
        const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email);
        
        const user = {
            ...session,
            email: email,
            role: isSuperAdmin ? 'SUPER_ADMIN' : (session.role || 'OPERATOR')
        };

        console.log(`[AUTH] Current User identified: ${email} | Role: ${user.role}`);
        return user;
    } catch (e) {
        console.error("[AUTH] Critical error in getCurrentUser:", e);
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('PLATINUM_AUTH_SESSION');
    cookieStore.delete('PLATINUM_ACTIVE');
    cookieStore.delete('PLATINUM_ROLE');
    revalidatePath('/');
    return { success: true };
}

export async function loginWithCredentials(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        // Cerca l'utente nel database (case-insensitive)
        const users: any[] = await prisma.$queryRaw`SELECT id, email, name, role, password FROM "User" WHERE LOWER(email) = LOWER(${email})`;
        const user = users[0];

        console.log(`[AUTH] Login attempt for: ${email} | Found in DB: ${!!user}`);

        if (!user) {
            return { success: false, error: "Utente non trovato" };
        }

        // VERIFICA PASSWORD RIGOROSA
        const dbPassword = user.password;
        if (dbPassword !== password) {
            console.warn(`[AUTH SECURITY] Password mismatch for ${email}. Access DENIED.`);
            return { success: false, error: "Password errata. Se è il primo accesso, assicurati di aver creato l'account correttamente." };
        }

        // Crea sessione
        const userData = {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            role: user.role,
            image: null
        };

        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        console.log(`[AUTH] Checking session. Cookies found: ${allCookies.length}`);

        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        };

        cookieStore.set('PLATINUM_AUTH_SESSION', JSON.stringify(userData), cookieOptions);

        // Segnale di presenza per il ClientAuthGuard (NON httpOnly così è leggibile dal JS)
        cookieStore.set('PLATINUM_ACTIVE', 'true', {
            ...cookieOptions,
            httpOnly: false
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
    try {
        const id = Math.random().toString(36).substring(7);
        const email = data.email.toLowerCase().trim();
        
        console.log(`[AUTH] Creating/Updating user: ${email} | Role: ${data.role}`);

        // Usiamo ON CONFLICT per gestire sia la creazione che l'aggiornamento (inclusa la password)
        await prisma.$executeRaw`
            INSERT INTO "User" (id, email, name, role, password, phone, "updatedAt") 
            VALUES (${id}, ${email}, ${data.name}, ${data.role}, ${data.password || null}, ${data.phone || null}, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE SET 
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                password = EXCLUDED.password,
                phone = EXCLUDED.phone,
                "updatedAt" = CURRENT_TIMESTAMP
        `;
        
        revalidatePath('/settings');
        return { success: true };
    } catch (e: any) {
        console.error("[AUTH] Create/Update User Error:", e);
        return { success: false, error: "Errore salvataggio utente: " + e.message };
    }
}
