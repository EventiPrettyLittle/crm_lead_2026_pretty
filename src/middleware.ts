import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Il controllo di autenticazione all'Edge è stato disabilitato a favore
    // del blocco vitale nel layout Node.js, poiché Vercel Edge spesso 
    // maschera i cookie durante i fetch interni RSC causando finti logout.
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
