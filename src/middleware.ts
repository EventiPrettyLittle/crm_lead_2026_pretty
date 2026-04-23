import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Lista rotte pubbliche
    if (
        pathname.startsWith('/login') || 
        pathname.startsWith('/api/auth') || 
        pathname.startsWith('/_next') || 
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const session = request.cookies.get('PLATINUM_AUTH_SESSION');

    // Se non c'è sessione e non siamo già su login, rimanda al login
    if (!session) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/|static|.*\\..*|_next).*)', '/'], 
};
