import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const email = 'eventiprettylittle@gmail.com';
        const name = 'Admin Platinum';
        const password = 'Admin2026!';
        
        // Forza aggiunta colonna password se manca
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT`);
        } catch (e) {
            console.log("Colonna password già presente o errore minore:", e);
        }

        // Verifica se esiste già
        const existingUsers: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = $1`, email);
        
        if (existingUsers.length > 0) {
            return NextResponse.json({ message: "L'utente admin esiste già!" });
        }

        // Crea utente
        const id = Math.random().toString(36).substring(7);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "User" (id, email, name, role, password, "updatedAt") VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`, 
            id, email, name, 'SUPER_ADMIN', password
        );

        return NextResponse.json({ 
            success: true, 
            message: "Utente Admin creato con successo!",
            credentials: {
                email,
                password
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
