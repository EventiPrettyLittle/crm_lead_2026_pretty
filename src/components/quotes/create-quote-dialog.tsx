'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, User, Loader2, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { searchLeads } from '@/actions/leads'
import { createQuote } from '@/actions/quotes'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import QuoteBuilder from './quote-builder'

export function CreateQuoteDialog() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [creating, setCreating] = useState(false)
    const [builderOpen, setBuilderOpen] = useState(false)
    const [newQuoteId, setNewQuoteId] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                try {
                    const results = await searchLeads(query)
                    setLeads(results)
                } catch (error) {
                    console.error(error)
                } finally {
                    setLoading(false)
                }
            } else {
                setLeads([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleCreateQuote = async () => {
        if (!selectedLead) return
        setCreating(true)
        try {
            const quote = await createQuote(selectedLead.id)
            setNewQuoteId(quote.id)
            setBuilderOpen(true)
            setOpen(false)
            toast.success("Preventivo inizializzato correttamente")
        } catch (error) {
            toast.error("Errore durante la creazione del preventivo")
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-12 px-8 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 h-5 w-5" /> Nuovo Preventivo
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative">
                        <FileText className="absolute top-4 right-6 h-24 w-24 opacity-10" />
                        <DialogTitle className="text-3xl font-black tracking-tight mb-2">Nuovo Preventivo</DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium opacity-90">
                            Seleziona un cliente dal database per iniziare a creare il preventivo.
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Cerca cliente per nome o email..."
                                className="pl-12 rounded-2xl border-slate-100 bg-slate-50 py-7 font-bold text-lg focus:ring-indigo-500 transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                </div>
                            ) : leads.length > 0 ? (
                                leads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        onClick={() => setSelectedLead(lead)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2",
                                            selectedLead?.id === lead.id 
                                                ? "border-indigo-600 bg-indigo-50/50" 
                                                : "border-transparent bg-slate-50 hover:bg-slate-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900">{lead.firstName} {lead.lastName}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{lead.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        {selectedLead?.id === lead.id && (
                                            <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : query.length >= 2 ? (
                                <p className="text-center py-10 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Nessun cliente trovato</p>
                            ) : (
                                <p className="text-center py-10 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Inizia a scrivere per cercare...</p>
                            )}
                        </div>

                        <Button 
                            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-7 font-black text-lg tracking-widest transition-all shadow-xl shadow-indigo-100 disabled:opacity-30"
                            disabled={!selectedLead || creating}
                            onClick={handleCreateQuote}
                        >
                            {creating ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-5 w-5" />
                            )}
                            Configura Preventivo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden QuoteBuilder that opens when quote is created */}
            {builderOpen && newQuoteId && selectedLead && (
                <QuoteBuilder 
                    key={newQuoteId}
                    leadId={selectedLead.id} 
                    quoteId={newQuoteId} 
                    defaultOpen={true}
                    onClose={() => {
                        setBuilderOpen(false)
                        setNewQuoteId(null)
                        setSelectedLead(null)
                    }}
                />
            )}
        </>
    )
}
