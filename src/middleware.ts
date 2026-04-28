import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Ignora le richieste preflight OPTIONS che non trasportano mai i cookie
    if (request.method === 'OPTIONS') {
        return NextResponse.next();
    }

    // Lista rotte pubbliche e assets
    if (
        pathname.startsWith('/login') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/_next') || 
        pathname === '/favicon.ico' ||
        pathname.includes('.') // Ignora file fisici (.txt, .js, .json, ecc) che non richiedono auth
    ) {
        return NextResponse.next();
    }

    const session = request.cookies.get('PLATINUM_AUTH_SESSION');
    const active = request.cookies.get('PLATINUM_ACTIVE');

    // Se entrambi i cookie di autenticazione e presenza sono mancanti, l'utente è davvero disconnesso
    if (!session && !active) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
