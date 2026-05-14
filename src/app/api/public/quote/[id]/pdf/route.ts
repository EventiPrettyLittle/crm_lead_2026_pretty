import { renderToBuffer } from '@react-pdf/renderer';
import { QuoteDocument } from '@/components/quotes/quote-pdf';
import { getQuote } from '@/actions/quotes';
import { NextResponse } from 'next/server';
import React from 'react';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const quote = await getQuote(params.id);
        
        if (!quote) {
            return new NextResponse("Preventivo non trovato", { status: 404 });
        }

        const buffer = await renderToBuffer(<QuoteDocument quote={quote} />);
        
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Preventivo-${quote.number}.pdf"`,
                'Cache-Control': 'no-store, max-age=0'
            },
        });
    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return new NextResponse(`Errore generazione PDF: ${error.message}`, { status: 500 });
    }
}
