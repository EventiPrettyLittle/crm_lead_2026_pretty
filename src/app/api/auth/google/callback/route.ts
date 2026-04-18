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
        
        if (!userInfo || !userInfo.email) {
            return NextResponse.json({ error: 'Impossibile recuperare l\'email dall\'account Google' }, { status: 400 })
        }

        const prisma = (await import("@/lib/prisma")).default

        const isCalendarConnect = state === 'calendar_connect';
        const currentSessionCookie = request.cookies.get('PLATINUM_AUTH_SESSION');
        let currentSession = null;
        if (currentSessionCookie) {
            try { currentSession = JSON.parse(currentSessionCookie.value); } catch(e) {}
        }

        // Sincronizziamo l'utente nel Database in modo nativo con Prisma
        let dbUser: any = null;
        try {
            // FORZATURA: Assicuriamoci che la colonna esista fisicamente
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokens" TEXT;`);
            } catch(sqle) {}
            
            const targetEmail = (isCalendarConnect && currentSession?.email) 
                ? currentSession.email.toLowerCase().trim() 
                : userInfo.email.toLowerCase().trim();

            const tokensStr = JSON.stringify(tokens);

            // Salvataggio 
            dbUser = await (prisma.user as any).upsert({
                where: { email: targetEmail },
                update: { googleTokens: tokensStr },
                create: {
                    id: userInfo.id || Math.random().toString(36).substring(7),
                    email: targetEmail,
                    name: userInfo.name || 'User',
                    role: (targetEmail === 'eventiprettylittle@gmail.com' || 
                           targetEmail === 'lucavitale88@gmail.com' || 
                           targetEmail === 'maria.vitale@prettylittle.it') ? 'SUPER_ADMIN' : 'USER',
                    googleTokens: tokensStr
                }
            });
        } catch (e) {
            console.error('Error in DB Sync:', e);
        }

        const redirectUrl = isCalendarConnect ? '/calendar' : '/';
        const response = NextResponse.redirect(new URL(redirectUrl, request.url))

        // 1. SALVIAMO I TOKEN IN UN COOKIE DEDICATO (Leggero e persistente)
        response.cookies.set('PLATINUM_G_SYNC', JSON.stringify(tokens), {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        })

        // 2. AGGIORNIAMO LA SESSIONE CRM (Senza appesantirla con i token se possibile)
        const sessionData = {
            id: dbUser?.id || userInfo.id || currentSession?.id,
            name: dbUser?.name || userInfo.name || currentSession?.name || 'User',
            email: currentSession?.email || userInfo.email,
            picture: userInfo.picture || currentSession?.picture,
            role: dbUser?.role || currentSession?.role || 'USER'
        };

        response.cookies.set('PLATINUM_AUTH_SESSION', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: false,
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
