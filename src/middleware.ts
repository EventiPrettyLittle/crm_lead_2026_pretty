import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // 1. Escludi rotte statiche, asset e rotte di autenticazione
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api/auth') || 
        pathname.startsWith('/login') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const session = request.cookies.get('user_session');
    const isAction = request.headers.has('next-action');
    const isPrefetch = request.headers.get('purpose') === 'prefetch';
    
    // 2. Se non c'è sessione e non siamo in login, vai a login
    // Permettiamo TUTTE le richieste non-GET (POST, PUT, DELETE) per evitare di interrompere azioni
    // Il controllo di autenticazione reale avverrà dentro la Server Action
    if (request.method !== 'GET') {
        return NextResponse.next();
    }

    if (!session && !isAction && !isPrefetch) {
        return NextResponse.redirect(new URL('/login?reason=missing_session', request.url));
    }

    // Deployment Refresh & Fix: 2026-04-18 15:15
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
