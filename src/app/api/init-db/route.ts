import { initDatabase } from "@/actions/db-init";
import { NextResponse } from "next/server";

export async function GET() {
    const res = await initDatabase();
    return NextResponse.json(res);
}
