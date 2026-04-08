import { getAuthUrl } from "@/lib/google-auth"
import { NextResponse } from "next/server"

export async function GET() {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
}
