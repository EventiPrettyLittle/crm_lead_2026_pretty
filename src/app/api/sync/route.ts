import { NextRequest, NextResponse } from "next/server";
import { syncLeadsFromGoogleSheet } from "@/actions/leads";

// This endpoint can be called by Google Apps Script to trigger a sync
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const spreadsheetId = body.spreadsheetId || "1PGK2PQgYONq3v27Zpm-uEOsj1Hif5yJcdrmQ02klzQg";
        
        console.log("Automatic sync triggered for:", spreadsheetId);
        const result = await syncLeadsFromGoogleSheet(spreadsheetId);
        
        return NextResponse.json({ 
            success: true, 
            message: "Sincronizzazione automatica completata",
            details: result 
        });
    } catch (error: any) {
        console.error("Webhook sync error:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}

// Support GET for simple testing
export async function GET() {
    return NextResponse.json({ message: "Sync Webhook is active. Use POST to trigger sync." });
}
