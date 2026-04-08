'use client'

import { useState } from 'react';
import { updateQuoteStatus } from "@/actions/quotes";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuoteRowActions({ quote }: { quote: any }) {
    const [loading, setLoading] = useState(false);

    async function handleStatus(status: string) {
        setLoading(true);
        try {
            await updateQuoteStatus(quote.id, status, quote.leadId);
            toast.success(`Stato aggiornato a ${status}`);
        } catch (e) {
            toast.error("Errore aggiornamento");
        } finally {
            setLoading(false);
        }
    }

    if (quote.status === 'ACCETTATO' || quote.status === 'RIFIUTATO') return null;

    return (
        <div className="flex gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                disabled={loading}
                onClick={() => handleStatus('ACCETTATO')}
                className="rounded-xl h-10 w-10 text-emerald-500 hover:bg-emerald-50 transition-all border border-emerald-50"
            >
                <Check className="h-4 w-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                disabled={loading}
                onClick={() => handleStatus('RIFIUTATO')}
                className="rounded-xl h-10 w-10 text-rose-500 hover:bg-rose-50 transition-all border border-rose-50"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
