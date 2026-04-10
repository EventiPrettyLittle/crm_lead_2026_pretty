'use client'

import { useState } from 'react';
import { deleteQuote, updateQuoteStatus } from "@/actions/quotes";
import { toast } from "sonner";
import { Check, X, Pencil, Eye, Printer, MoreHorizontal, Mail, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import QuoteBuilder from "./quote-builder";
import { QuotePreviewDialog } from "./quote-preview-dialog";
import Link from "next/link";

export function QuoteRowActions({ quote }: { quote: any }) {
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    async function handleDelete() {
        if (!confirm("Sei sicuro di voler eliminare definitivamente questo preventivo?")) return;
        setDeleting(true);
        try {
            await deleteQuote(quote.id, quote.leadId);
            toast.success("Preventivo eliminato");
        } catch (e) {
            toast.error("Errore durante l'eliminazione");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex gap-2 items-center">
            {/* Anteprima Rapida */}
            <QuotePreviewDialog quote={quote} />

            {/* Stampa Rapida */}
            <QuotePreviewDialog quote={quote} autoPrint={true} />

            {/* Modifica */}
            <QuoteBuilder 
                leadId={quote.leadId} 
                quoteId={quote.id} 
                existingQuote={quote} 
            />

            {/* Accetta/Rifiuta rapido se in bozza/inviato */}
            {(quote.status === 'BOZZA' || quote.status === 'INVIATO') && (
                <div className="flex gap-1 border-l border-slate-100 pl-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={loading}
                        onClick={() => handleStatus('ACCETTATO')}
                        className="rounded-xl h-10 w-10 text-emerald-500 hover:bg-emerald-50 transition-all"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={loading}
                        onClick={() => handleStatus('RIFIUTATO')}
                        className="rounded-xl h-10 w-10 text-rose-500 hover:bg-rose-50 transition-all"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Elimina */}
            <Button 
                variant="ghost" 
                size="icon" 
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    );
}
