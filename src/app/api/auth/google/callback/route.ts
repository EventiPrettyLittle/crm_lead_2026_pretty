import { getTokens } from "@/lib/google-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    try {
        const tokens = await getTokens(code)
        const { getUserInfo } = await import("@/lib/google-auth")
        const userInfo = await getUserInfo(tokens)
        const prisma = (await import("@/lib/prisma")).default

        // Sincronizziamo l'utente nel Database e salviamo i token in modo permanente
        let dbUser: any = null;
        try {
            // Assicura che la colonna googleTokens esista
            await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokens" TEXT;`);
            
            const users: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = $1 LIMIT 1`, userInfo.email);
            if (users.length > 0) {
                dbUser = users[0];
                // Aggiorna i token Google nel DB — così non si perdono mai al logout/cambio cookie
                await prisma.$executeRawUnsafe(
                    `UPDATE "User" SET "googleTokens" = $1 WHERE email = $2`,
                    JSON.stringify(tokens),
                    userInfo.email
                );
            } else {
                const newId = userInfo.id || Math.random().toString(36).substring(7);
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "User" (id, email, name, role, "googleTokens") VALUES ($1, $2, $3, $4, $5)`,
                    newId,
                    userInfo.email,
                    userInfo.name || 'User',
                    (userInfo.email === 'eventiprettylittle@gmail.com' || 
                     userInfo.email === 'lucavitale88@gmail.com' || 
                     userInfo.email === 'maria.vitale@prettylittle.it') ? 'SUPER_ADMIN' : 'USER',
                    JSON.stringify(tokens)
                );
            }
        } catch (e) {
            console.error('Error saving google tokens to DB:', e);
        }

        const isCalendarConnect = state === 'calendar_connect';
        const redirectUrl = isCalendarConnect ? '/calendar' : '/';
        const response = NextResponse.redirect(new URL(redirectUrl, request.url))

        const isProd = process.env.NODE_ENV === 'production';

        // Salva anche nel cookie come backup (30 giorni)
        response.cookies.set('google_tokens', JSON.stringify(tokens), {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        })

        // Aggiorna SEMPRE la user_session al login per garantire l'autorizzazione
        const displayName = dbUser?.name || userInfo.name || 'User';
        response.cookies.set('user_session', JSON.stringify({
            id: dbUser?.id || userInfo.id,
            name: displayName,
            email: userInfo.email,
            picture: userInfo.picture,
            role: dbUser?.role || 'USER'
        }), {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        })

        return response
    } catch (error) {
        console.error('Error exchanging code for tokens:', error)
        return NextResponse.json({ error: 'Failed to exchange code' }, { status: 500 })
    }
}
