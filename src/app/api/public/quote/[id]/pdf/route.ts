import { getQuote } from '@/actions/quotes';
import { NextResponse } from 'next/server';

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

        // Utilizziamo dynamic imports e React.createElement per evitare errori di parsing JSX
        // e problemi di build con @react-pdf/renderer in ambiente Turbopack/Edge.
        const { renderToBuffer } = await import('@react-pdf/renderer');
        const { QuoteDocument } = await import('@/components/quotes/quote-pdf');
        const React = await import('react');

        const buffer = await renderToBuffer(React.createElement(QuoteDocument as any, { quote }));
        
        return new NextResponse(buffer as any, {
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
