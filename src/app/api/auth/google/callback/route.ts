import { getTokens } from "@/lib/google-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // 'calendar' or null

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    try {
        const tokens = await getTokens(code)
        const { getUserInfo } = await import("@/lib/google-auth")
        const userInfo = await getUserInfo(tokens)
        const prisma = (await import("@/lib/prisma")).default

        // Sincronizziamo l'utente nel Database
        let dbUser: any = null;
        try {
            const users: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE email = $1 LIMIT 1`, userInfo.email);
            if (users.length > 0) {
                dbUser = users[0];
            } else {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "User" (id, email, name, role) VALUES ($1, $2, $3, $4)`,
                    userInfo.id || Math.random().toString(36).substring(7),
                    userInfo.email,
                    userInfo.name || 'User',
                    (userInfo.email === 'eventiprettylittle@gmail.com' || userInfo.email === 'lucavitale88@gmail.com') ? 'SUPER_ADMIN' : 'USER'
                );
            }
        } catch (e) {}

        const isCalendarConnect = state === 'calendar_connect';
        const redirectUrl = isCalendarConnect ? '/calendar' : '/';
        const response = NextResponse.redirect(new URL(redirectUrl, request.url))

        // Salva sempre i token Google (servono per le API Calendar/Sheets)
        response.cookies.set('google_tokens', JSON.stringify(tokens), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 
        })

        // Se è un collegamento calendario, NON toccare la sessione esistente
        // Se è un login Google, creare/aggiornare la sessione
        const existingSession = request.cookies.get('user_session');
        if (!isCalendarConnect && !existingSession) {
            const displayName = dbUser?.name || userInfo.name || 'User';
            response.cookies.set('user_session', JSON.stringify({
                id: dbUser?.id || userInfo.id,
                name: displayName,
                email: userInfo.email,
                picture: userInfo.picture,
                role: dbUser?.role || 'USER'
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 
            })
        }

        return response
    } catch (error) {
        console.error('Error exchanging code for tokens:', error)
        return NextResponse.json({ error: 'Failed to exchange code' }, { status: 500 })
    }
}
