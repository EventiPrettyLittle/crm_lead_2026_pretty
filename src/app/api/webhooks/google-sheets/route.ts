import { NextResponse } from 'next/server';
import { importLeadsAction } from '@/actions/leads';
import { mapRowToLead } from '@/lib/import-utils';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        
        // Log the incoming data for debugging
        console.log('Incoming Google Sheets Webhook:', data);

        // Allow single lead or multiple leads
        const leadsData = Array.isArray(data) ? data : [data];
        
        // Map the rows to our internal Lead structure
        const parsedLeads = leadsData.map(row => mapRowToLead(row)).filter(l => l.externalId);

        if (parsedLeads.length === 0) {
            return NextResponse.json({ 
                success: false, 
                message: "No valid leads found in payload. Ensure 'Email' column is present." 
            }, { status: 400 });
        }

        const result = await importLeadsAction(parsedLeads);

        return NextResponse.json({ 
            success: true, 
            message: `Successfully processed ${result.success} leads.`,
            details: result 
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
