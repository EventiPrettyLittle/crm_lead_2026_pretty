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

        // 1. SALVIAMO I TOKEN IN MODO PERMANENTE NEL DB (Fonte di verità unica)
        try {
            const targetEmail = (isCalendarConnect && currentSession?.email) 
                ? currentSession.email.toLowerCase().trim() 
                : userInfo.email.toLowerCase().trim();

            await (prisma.user as any).upsert({
                where: { email: targetEmail },
                update: { googleTokens: JSON.stringify(tokens) },
                create: {
                    id: userInfo.id || Math.random().toString(36).substring(7),
                    email: targetEmail,
                    name: userInfo.name || 'User',
                    role: 'USER',
                    googleTokens: JSON.stringify(tokens)
                }
            });
        } catch (e) {
            console.error('DB Token Backup Error:', e);
        }

        const redirectUrl = isCalendarConnect ? '/calendar' : '/';
        const response = NextResponse.redirect(new URL(redirectUrl, request.url));

        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        };

        // 2. CREIAMO LA SESSIONE ULTRA-LEGGERA
        const sessionData = {
            id: dbUser?.id || userInfo.id || currentSession?.id,
            name: dbUser?.name || userInfo.name || currentSession?.name || 'User',
            email: dbUser?.email || userInfo.email || currentSession?.email,
            picture: userInfo.picture || currentSession?.picture,
            role: dbUser?.role || currentSession?.role || 'USER'
        };

        response.cookies.set('PLATINUM_AUTH_SESSION', JSON.stringify(sessionData), cookieOptions);

        // 3. Segnale di presenza per ClientAuthGuard (NON httpOnly)
        response.cookies.set('PLATINUM_ACTIVE', 'true', {
            ...cookieOptions,
            httpOnly: false
        });

        // 4. BACKUP TOKENS (Cookie dedicato come paracadute se il DB ha problemi)
        response.cookies.set('PLATINUM_G_SYNC', JSON.stringify(tokens), {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 30 // 30 giorni
        });

        return response
    } catch (error) {
        console.error('Error exchanging code for tokens:', error)
        return NextResponse.json({ error: 'Failed to exchange code' }, { status: 500 })
    }
}
