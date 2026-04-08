import { getAuthUrl } from "@/lib/google-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    // Se c'è già una sessione utente attiva, è un collegamento calendario
    // Passiamo state=calendar_connect per preservare la sessione nel callback
    const existingSession = request.cookies.get('user_session');
    const state = existingSession ? 'calendar_connect' : undefined;
    const url = getAuthUrl(state)
    return NextResponse.redirect(url)
}
