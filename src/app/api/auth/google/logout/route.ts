import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const cookieStore = await cookies()
    cookieStore.delete('google_calendar_tokens')
    
    return NextResponse.redirect(new URL('/calendar', request.url))
}
