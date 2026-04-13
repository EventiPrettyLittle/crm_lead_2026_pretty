import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const cookieStore = await cookies()
    
    // Cancella TUTTI i cookie di sessione e token
    cookieStore.delete('user_session')
    cookieStore.delete('google_tokens')
    cookieStore.delete('google_calendar_tokens')
    
    // Rimanda al LOGIN
    return NextResponse.redirect(new URL('/login', request.url))
}
