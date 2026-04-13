import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const cookieStore = await cookies()
    
    // Cancella SOLO la sessione dell'utente nel CRM
    // NON cancelliamo i token Google così il calendario rimane collegato
    cookieStore.delete('user_session')
    
    // Rimanda al LOGIN
    return NextResponse.redirect(new URL('/login', request.url))
}
