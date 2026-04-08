'use client'

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { Lead, Quote } from "@prisma/client"

interface WhatsAppButtonProps {
    lead: Lead;
    quote?: Quote;
}

export function WhatsAppButton({ lead, quote }: WhatsAppButtonProps) {
    const handleClick = () => {
        if (!lead.phoneRaw) return; // Or normalized phone

        // normalize phone: strip spaces, ensure country code. 
        // Assuming phoneRaw might be bare, user spec said "phone_normalized" exists in import.
        // We use phoneRaw for now as fallback.
        const phone = lead.phoneNormalized || lead.phoneRaw.replace(/\D/g, '');

        let text = `Ciao ${lead.firstName}, `;

        if (quote) {
            // "nome cliente, riferimento evento, importo preventivo, link al PDF"
            text += `ecco il preventivo per il tuo evento ${lead.eventType ? `(${lead.eventType})` : ''}. \n`;
            text += `Importo totale: €${Number(quote.totalAmount).toFixed(2)}. \n`;
            // Link to PDF? In a real app, this would be a public URL to the generated PDF.
            // For now, we put a placeholder or maybe we upload it first.
            text += `Puoi visualizzare il preventivo qui: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${lead.id}`;
        } else {
            text += `come stai?`;
        }

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');

        // Log activity?
    };

    return (
        <Button
            variant="outline"
            className="bg-green-500 text-white hover:bg-green-600 border-none"
            onClick={handleClick}
        >
            <MessageCircle className="mr-2 h-4 w-4" />
            Invia su WhatsApp
        </Button>
    )
}
