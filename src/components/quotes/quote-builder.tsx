'use client'

import { useState, useEffect } from 'react'
import { createQuote, addItemToQuote, getQuote, deleteQuoteItem, deleteQuote, sendQuoteByEmail, getLeadsMini, updateQuoteLead } from '@/actions/quotes'
import { updateLeadDetails } from '@/actions/lead-actions'
import { getProducts } from '@/actions/products'
import { markQuoteAsSent } from '@/actions/quote-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QuoteDocument } from '@/components/quotes/quote-pdf'
import { Loader2, Plus, FileDown, Trash2, Send, Pencil, Euro, CreditCard, Banknote, Calendar, FileText, CheckCircle2, ChevronDown, Sparkles, User, UserCheck, Search, Save, X } from 'lucide-react'
import { updateQuoteDetails } from '@/actions/quotes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface QuoteBuilderProps {
    leadId: string
    quoteId?: string
    existingQuote?: any
    onClose?: () => void
}

export default function QuoteBuilder({ leadId: initialLeadId, quoteId, existingQuote, onClose }: QuoteBuilderProps) {
    const [open, setOpen] = useState(false);
    const [qId, setQId] = useState<string | null>(quoteId || null);
    const [quote, setQuote] = useState<any>(existingQuote || null);
    const [currentLeadId, setCurrentLeadId] = useState(initialLeadId);
    
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [editClient, setEditClient] = useState(false);
    const [leadQuery, setLeadQuery] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);

    const filteredLeads = leads.filter(l => 
        (l.firstName + ' ' + l.lastName).toLowerCase().includes(leadQuery.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(leadQuery.toLowerCase())
    );

    // Item form state
    const [desc, setDesc] = useState("");
    const [qty, setQty] = useState(1);
    const [origPrice, setOrigPrice] = useState(0);
    const [discPercent, setDiscPercent] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);

    // Quote details state
    const [paymentMethod, setPaymentMethod] = useState(existingQuote?.paymentMethod || "BONIFICO");
    const [discountTotal, setDiscountTotal] = useState(Number(existingQuote?.discountTotal) || 0);
    const [createdBy, setCreatedBy] = useState(existingQuote?.createdBy || "");
    const [notes, setNotes] = useState(existingQuote?.notes || "");

    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");

    useEffect(() => {
        if (qId) {
            fetchQuote(qId);
        }
        fetchProducts();
        fetchLeads();
    }, [qId]);

    // Handle auto-calculations for item form
    useEffect(() => {
        if (origPrice > 0) {
            const percent = ((origPrice - finalPrice) / origPrice) * 100;
            setDiscPercent(Math.max(0, percent));
        } else {
            setDiscPercent(0);
        }
    }, [origPrice, finalPrice]);

    const fetchQuote = async (id: string) => {
        try {
            const result = await getQuote(id);
            const data = result as any;
            setQuote(data);
            if (data) {
                setPaymentMethod(data.paymentMethod || "BONIFICO");
                setDiscountTotal(Number(data.discountTotal) || 0);
                setNotes(data.notes || "");
                setClientName(`${data.lead?.firstName || ''} ${data.lead?.lastName || ''}`);
                setClientEmail(data.lead?.email || "");
                setCurrentLeadId(data.leadId);
                
                // Fallback a cascata: Quote -> Company Settings -> Session
                let creator = data.createdBy || data.companySettings?.referente;
                if (!creator) {
                    const { getCurrentUser } = await import("@/actions/auth");
                    const user = await getCurrentUser();
                    creator = user?.name || "Luca Vitale";
                }
                setCreatedBy(creator);
            }
        } catch (error) {
            console.error("Fetch quote error:", error);
        }
    };

    const fetchLeads = async () => {
        const res = await getLeadsMini();
        setLeads(res);
    };

    const fetchProducts = async () => {
        try {
            const res = await getProducts();
            setProducts(res as any[]);
        } catch (error) {
            console.error("Fetch products error:", error);
        }
    };

    const handleAddItem = async () => {
        if (!qId || !desc) return;
        setLoading(true);
        try {
            await addItemToQuote(qId, { 
                description: desc, 
                quantity: qty, 
                originalPrice: origPrice,
                unitPrice: finalPrice, 
                discount: discPercent,
                vatRate: 22 
            });
            await fetchQuote(qId);
            setDesc("");
            setPriceStatesDefault();
            toast.success("Voce aggiunta");
        } catch (error: any) {
            console.error("Errore aggiunta voce:", error);
            toast.error(`Errore stampato: ${error?.message || "Impossibile salvare"}`);
        } finally {
            setLoading(false);
        }
    };

    const setPriceStatesDefault = () => {
        setQty(1);
        setOrigPrice(0);
        setDiscPercent(0);
        setFinalPrice(0);
    }

    const handleChangeLead = async (lId: string) => {
        if (!qId) return;
        try {
            await updateQuoteLead(qId, lId);
            await fetchQuote(qId);
            toast.success("Destinatario aggiornato");
        } catch (error) {
            toast.error("Errore");
        }
    };

    const handleUpdateClientInfo = async () => {
        if (!currentLeadId) return;
        setLoading(true);
        try {
            const parts = clientName.split(' ');
            const fName = parts[0];
            const lName = parts.slice(1).join(' ') || '-';
            
            await updateLeadDetails(currentLeadId, {
                firstName: fName,
                lastName: lName,
                email: clientEmail
            });
            
            await fetchQuote(qId!);
            setEditClient(false);
            toast.success("Anagrafica cliente salvata");
        } catch (error) {
            toast.error("Errore salvataggio");
        } finally {
            setLoading(false);
        }
    };

    const selectProduct = (p: any) => {
        setDesc(p.name);
        setOrigPrice(Number(p.price));
        setFinalPrice(Number(p.price));
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!qId) return;
        setLoading(true);
        try {
            await deleteQuoteItem(itemId, qId);
            await fetchQuote(qId);
        } catch (error) {
            toast.error("Errore");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDetails = async () => {
        if (!qId) return;
        try {
            await updateQuoteDetails(qId, {
                paymentMethod,
                discountTotal: Number(discountTotal),
                notes
            });
            await fetchQuote(qId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendEmailAndMark = async () => {
        if (!qId) return;
        setSending(true);
        try {
            const emailResult = await sendQuoteByEmail(qId);
            if (!emailResult.success) {
                  toast.error(`Errore email: ${emailResult.error}`);
                  setSending(false);
                  return;
            }

            const res = await markQuoteAsSent(qId, currentLeadId);
            if (res.success) {
                await fetchQuote(qId);
                toast.success("Inviato!");
                setTimeout(() => setOpen(false), 500);
            }
        } finally {
            setSending(false);
        }
    };

    const handleDeleteQuote = async () => {
        if (!qId) return;
        if (!confirm("Eliminare definitivamente?")) return;
        await deleteQuote(qId, currentLeadId);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val && onClose) onClose();
        }}>
            <DialogTrigger asChild>
                {existingQuote ? (
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-md transition-all">
                        <Pencil className="h-4 w-4 text-slate-400" />
                    </Button>
                ) : (
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black h-12 px-8 shadow-lg shadow-indigo-200">
                        <Plus className="mr-2 h-5 w-5" /> Nuovo Preventivo
                    </Button>
                )}
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[850px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] bg-white">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-8 text-white relative shrink-0">
                    <div className="absolute top-4 right-8 opacity-10">
                        <FileText className="h-32 w-32" />
                    </div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-4 w-full">
                            <div className="flex justify-between items-center">
                                <DialogTitle className="text-3xl font-black tracking-tight leading-none">
                                    {quote?.number ? `Preventivo #${quote.number}` : 'Configurazione'}
                                </DialogTitle>
                                <Badge className={cn(
                                    "rounded-full px-4 py-1 font-black text-[10px] tracking-widest uppercase border-none",
                                    quote?.status === 'BOZZA' ? "bg-slate-700 text-slate-300" :
                                    quote?.status === 'INVIATO' ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                                )}>
                                    {quote?.status || 'BOZZA'}
                                </Badge>
                            </div>

                            {/* Destination Component */}
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                            <UserCheck className="h-5 w-5" />
                                        </div>
                                        {editClient ? (
                                            <div className="flex flex-col gap-2">
                                                <Input 
                                                    value={clientName} 
                                                    onChange={(e) => setClientName(e.target.value)}
                                                    className="bg-white/10 border-white/20 text-white h-7 py-0 px-2 font-bold text-sm w-48"
                                                    placeholder="Nome e Cognome..."
                                                />
                                                <Input 
                                                    value={clientEmail} 
                                                    onChange={(e) => setClientEmail(e.target.value)}
                                                    className="bg-white/10 border-white/20 text-indigo-200 h-6 py-0 px-2 font-medium text-[11px] w-48"
                                                    placeholder="Email..."
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Destinatario</p>
                                                <p className="text-lg font-black text-white">{clientName || 'Seleziona cliente...'}</p>
                                                <p className="text-[11px] font-medium text-indigo-200/60">{clientEmail || 'Nessuna mail associata'}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {editClient ? (
                                            <>
                                                <Button onClick={handleUpdateClientInfo} size="sm" className="bg-indigo-500 hover:bg-indigo-600 rounded-lg h-8 font-black text-[10px] uppercase">
                                                    <Save className="mr-2 h-3.5 w-3.5" /> Salva
                                                </Button>
                                                <Button onClick={() => setEditClient(false)} variant="ghost" size="sm" className="text-white hover:bg-white/10 rounded-lg h-8">
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={() => setEditClient(true)} variant="ghost" size="icon" className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="h-10 px-4 rounded-[1.2rem] bg-white/5 border-white/10 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest">
                                                            <Search className="mr-2 h-4 w-4" /> Cambia
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-72 rounded-2xl p-2 shadow-2xl border-slate-100 font-bold">
                                                    <div className="p-2 border-b border-slate-50 mb-1 sticky top-0 bg-white z-10">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input 
                                                                placeholder="Cerca cliente..." 
                                                                className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[11px]" 
                                                                value={leadQuery}
                                                                onChange={(e) => setLeadQuery(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                        {filteredLeads.length === 0 ? (
                                                            <p className="p-4 text-center text-[10px] text-slate-400 uppercase font-black">Nessun risultato</p>
                                                        ) : (
                                                            filteredLeads.map(lead => (
                                                                <DropdownMenuItem key={lead.id} onClick={() => handleChangeLead(lead.id)} className="rounded-xl p-3 cursor-pointer hover:bg-indigo-50">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-slate-900">{lead.firstName} {lead.lastName}</span>
                                                                        <span className="text-[10px] text-slate-400 font-medium">{lead.email || '-'}</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ))
                                                        )}
                                                    </div>
                                                </DropdownMenuContent>
                                                </DropdownMenu>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
                    {/* Item Management Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Voci e Servizi</h3>
                           <div className="h-px flex-1 bg-slate-100 mx-4" />
                        </div>

                        <div className="space-y-3">
                            {quote?.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-sm bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900 text-base">{item.description}</p>
                                            {Number(item.discount) > 0 && (
                                                <Badge className="bg-rose-50 text-rose-600 border-none text-[9px] px-2 py-0.5 font-black rounded-lg">-{Math.round(Number(item.discount))}%</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">Qtà: {item.quantity}</span>
                                            <span className="text-[10px] font-bold text-slate-300 line-through">€{Number(item.originalPrice).toFixed(2)}</span>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100/50">Scontato: €{Number(item.unitPrice).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className="font-black text-indigo-600 text-xl">€{Number(item.totalPrice).toFixed(2)}</p>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50 transition-all" onClick={() => handleDeleteItem(item.id)}>
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 p-7 rounded-[3rem] bg-white border border-slate-100 mt-6 shadow-xl shadow-slate-200/20 relative border-l-4 border-l-indigo-500">
                            <div className="absolute top-6 right-8">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="rounded-full bg-slate-50 border-slate-200 text-slate-600 font-black text-[10px] h-9 px-5 hover:bg-indigo-600 hover:text-white transition-all">
                                            <Sparkles className="mr-2 h-4 w-4" /> Scegli dal Catalogo <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="rounded-2xl w-72 shadow-2xl border-slate-100 p-2">
                                        {products.map(p => (
                                            <DropdownMenuItem key={p.id} onClick={() => selectProduct(p)} className="p-3 rounded-xl cursor-pointer">
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="font-black text-slate-800">{p.name}</span>
                                                    <span className="text-indigo-600 font-black">€{Number(p.price).toFixed(0)}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-6">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nuova Voce</Label>
                                    <Input placeholder="Es: Allestimento Floreale o Ulteriore ora Extra..." value={desc} onChange={(e) => setDesc(e.target.value)} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all" />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Qtà</Label>
                                    <Input type="number" value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold" />
                                </div>
                                <div className="col-span-8 md:col-span-4">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Listino (€)</Label>
                                    <Input type="number" step="0.01" value={origPrice || ''} onChange={(e) => {
                                        const newPrice = Number(e.target.value);
                                        setOrigPrice(newPrice);
                                        setFinalPrice(newPrice);
                                    }} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold" />
                                </div>
                                
                                <div className="col-span-6 md:col-span-4">
                                    <Label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 block ml-1">Prezzo Scontato (€)</Label>
                                    <Input type="number" step="0.01" value={finalPrice || ''} onChange={(e) => setFinalPrice(Number(e.target.value))} className="h-14 rounded-2xl border-indigo-100 bg-indigo-50/30 font-black text-indigo-600 text-lg" />
                                </div>
                                <div className="col-span-6 md:col-span-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Sconto %</Label>
                                    <div className="relative">
                                        <Input type="number" value={discPercent.toFixed(1)} readOnly className="h-14 rounded-2xl border-slate-100 bg-slate-100/50 font-black pr-10" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                                    </div>
                                </div>
                                <div className="col-span-12 md:col-span-5 flex items-end">
                                    <Button onClick={handleAddItem} disabled={loading || !desc} className="w-full h-14 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02]">
                                        Aggiungi {quote?.status === 'ACCETTATO' ? 'Extra' : 'al Preventivo'} <Plus className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                         <div className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Referente e Metodo</Label>
                                <div className="rounded-[2rem] bg-white border border-slate-100 p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                                            <UserCheck className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Emanato da (Referente)</p>
                                            <Input 
                                                value={createdBy} 
                                                onChange={(e) => setCreatedBy(e.target.value)}
                                                onBlur={handleSaveDetails}
                                                className="border-none shadow-none font-black p-0 h-auto focus-visible:ring-0 text-slate-700 bg-transparent text-sm"
                                                placeholder="Nome del referente..."
                                            />
                                        </div>
                                    </div>
                                    <Separator className="bg-slate-50" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <Select value={paymentMethod} onValueChange={(val) => {
                                            setPaymentMethod(val);
                                            // Trigger auto-save on select change
                                            updateQuoteDetails(qId!, { paymentMethod: val });
                                        }}>
                                            <SelectTrigger className="border-none shadow-none font-black p-0 h-auto focus:ring-0 text-slate-700">
                                                <SelectValue placeholder="Metodo di Pagamento" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl font-bold">
                                                <SelectItem value="CARTA">Carta</SelectItem>
                                                <SelectItem value="CONTANTI">Contanti</SelectItem>
                                                <SelectItem value="BONIFICO">Bonifico</SelectItem>
                                                <SelectItem value="RATEALE">Rateale</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Separator className="bg-slate-50" />
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Note aggiuntive</span>
                                        </div>
                                        <Textarea
                                            className="border-none shadow-none focus-visible:ring-0 p-0 min-h-[80px] font-medium text-slate-600 text-sm leading-relaxed"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            onBlur={handleSaveDetails}
                                            placeholder="Inserisci note aggiuntive sulla logistica, scadenze acconti o specifiche tecniche..."
                                        />
                                    </div>
                                </div>
                            </div>
                         </div>

                         <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Euro className="h-48 w-48" />
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center opacity-70">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Imponibile Lordo</span>
                                    <span className="font-bold text-lg">€{(quote?.items?.reduce((acc: number, i: any) => acc + Number(i.totalPrice), 0) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sconto Finanziario (€)</span>
                                    <input
                                        type="number"
                                        className="bg-transparent border-none text-right font-black w-24 focus:ring-0 p-0 text-lg text-white"
                                        value={discountTotal}
                                        onChange={(e) => setDiscountTotal(Number(e.target.value))}
                                        onBlur={handleSaveDetails}
                                    />
                                </div>
                                <div className="h-px bg-white/20 my-6" />
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] block opacity-70">Saldo Netto</span>
                                        <span className="text-[10px] font-bold text-indigo-200">IVA inclusa (22%)</span>
                                    </div>
                                    <span className="text-5xl font-black tracking-tighter">€{Number(quote?.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                <DialogFooter className="p-8 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between sm:justify-between w-full">
                    <Button variant="ghost" size="sm" onClick={handleDeleteQuote} className="rounded-xl text-slate-400 hover:text-rose-500 font-black tracking-widest text-[10px] uppercase">
                        <Trash2 className="mr-2 h-4 w-4" /> Elimina
                    </Button>

                    <div className="flex gap-3 items-center">
                        <Button 
                            variant="secondary" 
                            className="rounded-[1.8rem] border border-slate-200 bg-white hover:bg-slate-50 font-black tracking-widest text-[10px] uppercase px-8 h-14 shadow-sm transition-all"
                            onClick={() => {
                                handleSaveDetails();
                                setOpen(false);
                                toast.success("Modifiche salvate con successo");
                            }}
                        >
                            <Save className="mr-2 h-4 w-4 text-indigo-600" /> Salva ed Esci
                        </Button>

                        {quote?.items?.length > 0 && (
                            <>
                                <PDFDownloadLink document={<QuoteDocument quote={quote} />} fileName={`preventivo_${quote.number || '00'}.pdf`}>
                                    {({ blob, url, loading: pdfLoading }) => (
                                        <Button variant="outline" className="rounded-[1.8rem] border-slate-200 font-black tracking-widest text-[10px] uppercase px-8 h-14 shadow-sm hover:bg-slate-50">
                                            {pdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4 text-indigo-600" />}
                                            Esporta PDF
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                                
                                <Button 
                                    onClick={handleSendEmailAndMark} 
                                    disabled={sending}
                                    className="rounded-[1.8rem] bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 font-black tracking-widest text-[10px] uppercase px-12 h-14 transition-all hover:scale-[1.03]"
                                >
                                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Invia
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
