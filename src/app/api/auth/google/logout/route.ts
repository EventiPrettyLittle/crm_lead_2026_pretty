import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const cookieStore = await cookies()
    
    // Cancella la sessione del CRM
    cookieStore.set('PLATINUM_AUTH_SESSION', '', { path: '/', expires: new Date(0) })
    cookieStore.delete('PLATINUM_AUTH_SESSION')

    // Cancella il segnale di presenza per il ClientAuthGuard
    cookieStore.set('PLATINUM_ACTIVE', '', { path: '/', expires: new Date(0) })
    cookieStore.delete('PLATINUM_ACTIVE')

    // Cancella anche i token Google per forzare il ricollegamento se necessario
    cookieStore.set('google_tokens', '', { path: '/', expires: new Date(0) })
    cookieStore.set('google_calendar_tokens', '', { path: '/', expires: new Date(0) })
    cookieStore.set('PLATINUM_G_SYNC', '', { path: '/', expires: new Date(0) })
    cookieStore.delete('PLATINUM_G_SYNC')
    
    // Rimanda al LOGIN
    return NextResponse.redirect(new URL('/login', request.url))
}
