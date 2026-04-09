'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Download, User as UserIcon, Calendar, Euro, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function QuotePreviewDialog({ quote }: { quote: any }) {
    if (!quote) return null;

    const total = Number(quote.totalAmount || 0);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-md transition-all group/btn">
                    <Eye className="h-5 w-5 text-slate-400 group-hover/btn:text-indigo-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-slate-900 p-8 text-white relative">
                    <FileText className="absolute top-4 right-6 h-24 w-24 opacity-10" />
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase">
                                    Preventivo #{quote.number}
                                </Badge>
                                <Badge className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                                    quote.status === 'BOZZA' && "bg-slate-700 text-slate-300",
                                    quote.status === 'INVIATO' && "bg-blue-600 text-white",
                                    quote.status === 'ACCETTATO' && "bg-emerald-600 text-white",
                                    quote.status === 'RIFIUTATO' && "bg-rose-600 text-white"
                                )}>
                                    {quote.status}
                                </Badge>
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tight">{quote.lead?.firstName} {quote.lead?.lastName}</DialogTitle>
                            <p className="text-slate-400 font-medium text-sm mt-1">{quote.lead?.email}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500">
                                <Calendar className="h-4 w-4" />
                                <div className="text-xs font-bold uppercase tracking-widest">Data Emissione</div>
                            </div>
                            <div className="text-sm font-black text-slate-900 ml-7">
                                {format(new Date(quote.createdAt), 'dd MMMM yyyy')}
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <div className="flex items-center justify-end gap-3 text-slate-500">
                                <div className="text-xs font-bold uppercase tracking-widest">Totale Lordo</div>
                                <Euro className="h-4 w-4" />
                            </div>
                            <div className="text-2xl font-black text-indigo-600">
                                €{total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dettaglio Servizi</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {quote.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 ring-1 ring-white">
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">{item.productName || 'Servizio'}</p>
                                        <p className="text-[10px] font-bold text-slate-400">Quantità: {item.quantity}</p>
                                    </div>
                                    <div className="text-right font-black text-slate-900">
                                        €{(Number(item.price) * item.quantity).toLocaleString('it-IT')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 font-black text-[10px] uppercase shadow-lg shadow-indigo-100 transition-all active:scale-95 gap-2">
                            <Download className="w-4 h-4" /> Scarica PDF
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-2xl border-slate-200 h-12 font-black text-[10px] uppercase gap-2 hover:bg-slate-50">
                            <FileText className="w-4 h-4" /> Stampa
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
