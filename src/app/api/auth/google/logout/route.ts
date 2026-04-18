import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const cookieStore = await cookies()
    
    // Cancella la sessione del CRM
    cookieStore.set('PLATINUM_AUTH_SESSION', '', { path: '/', expires: new Date(0) })
    
    // Per sicurezza extra, facciamo il delete standard
    cookieStore.delete('PLATINUM_AUTH_SESSION')

    // Cancella anche i token Google per forzare il ricollegamento se necessario
    cookieStore.set('google_tokens', '', { path: '/', expires: new Date(0) })
    cookieStore.set('google_calendar_tokens', '', { path: '/', expires: new Date(0) })
    
    // Rimanda al LOGIN
    return NextResponse.redirect(new URL('/login', request.url))
}
