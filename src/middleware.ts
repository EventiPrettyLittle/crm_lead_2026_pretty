import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Escludi rotte statiche e API di auth
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api/auth') || 
        pathname.startsWith('/login') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const session = request.cookies.get('user_session');

    // Se non c'è sessione e non siamo in login, vai a login
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
