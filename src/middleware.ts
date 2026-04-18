import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Middleware totalmente passivo per evitare loop di redirect sui sottodomini.
    // La logica di protezione è spostata in src/app/(crm)/layout.tsx (Server Side).
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
