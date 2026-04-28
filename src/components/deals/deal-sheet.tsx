'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { updateDeal } from "@/actions/deals";
import { toast } from "sonner";
import { formatITDate } from "@/lib/utils";
import { Save, Package, Sparkles, Clock, MapPin, Plus, Trash2, Layers, ListChecks, NotebookPen, Loader2, ArrowLeft, Eye, Printer, Calendar } from "lucide-react";
import { QuotePreviewDialog } from "@/components/quotes/quote-preview-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

interface DealSheetProps {
    leadId: string;
    initialData: any;
    leadName: string;
    leadLocation?: string;
    acceptedQuote?: any;
    eventDate?: Date | null;
}

const DynamicField = ({ 
    label, 
    field, 
    value, 
    onChange, 
    placeholder = "", 
    isAccent = false 
}: { 
    label: string, 
    field: string, 
    value: string, 
    onChange: (field: string, val: string) => void,
    placeholder?: string, 
    isAccent?: boolean 
}) => {
    // Parsing dei dati: supporta sia "testo" che "testo:quantità"
    const items = (value ? value.split(',') : ['']).map(item => {
        const [text, qty] = item.split(':');
        return { text: text || '', qty: qty || '' };
    });

    const updateItem = (index: number, newText: string, newQty: string) => {
        const newItems = [...items];
        newItems[index] = { text: newText, qty: newQty };
        const serialized = newItems.map(it => `${it.text}:${it.qty}`).join(',');
        onChange(field, serialized);
    };

    const addRow = () => {
        const newItems = [...items, { text: '', qty: '' }];
        onChange(field, newItems.map(it => `${it.text}:${it.qty}`).join(','));
    };

    const removeRow = (index: number) => {
        if (items.length <= 1) {
            onChange(field, '');
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        onChange(field, newItems.map(it => `${it.text}:${it.qty}`).join(','));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</Label>
                    <span className="bg-slate-100 text-slate-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-slate-200/50">
                        {value ? items.length : 0}
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        addRow();
                    }}
                    className="h-5 w-5 p-0 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                    <Plus className="h-2.5 w-2.5" />
                </Button>
            </div>
            <div className="space-y-2 pr-1 max-h-[180px] overflow-y-auto custom-scrollbar">
                {items.map((item, i) => (
                    <div key={`${field}-${i}`} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200 items-end">
                        <div className="flex-1">
                            <Input 
                                value={item.text} 
                                placeholder={placeholder}
                                onChange={(e) => updateItem(i, e.target.value, item.qty)} 
                                className={cn(
                                    "h-10 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs focus:bg-white transition-all",
                                    isAccent && "text-indigo-600"
                                )}
                            />
                        </div>
                        
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase leading-none">QT</span>
                            <Input 
                                value={item.qty} 
                                placeholder="0"
                                onChange={(e) => updateItem(i, item.text, e.target.value)} 
                                className="h-8 w-10 rounded-lg bg-indigo-50/50 border-none font-black text-[11px] text-center text-indigo-600 p-0 focus:ring-0"
                            />
                        </div>

                        <div className="pb-1">
                            {items.length > 1 && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeRow(i);
                                    }}
                                    type="button"
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-all focus:outline-none"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function DealSheet({ leadId, initialData, leadName, leadLocation, acceptedQuote, eventDate }: DealSheetProps) {
    const [data, setData] = useState(initialData);
    const [saving, setSaving] = useState(false);
    const quoteItems = acceptedQuote?.items ? (Array.isArray(acceptedQuote.items) ? acceptedQuote.items : []) : [];
    const productAssignments = data.productAssignments ? JSON.parse(data.productAssignments) : [];

    // Logica di visibilità DERIVATA e REATTIVA
    const showFavor2 = productAssignments.some((a: any) => a.target === 'favor2');
    const showFavor3 = productAssignments.some((a: any) => a.target === 'favor3');
    const showFavor4 = productAssignments.some((a: any) => a.target === 'favor4');
    
    const showExtra1 = productAssignments.some((a: any) => a.target === 'extra1');
    const showExtra2 = productAssignments.some((a: any) => a.target === 'extra2');
    const showExtra3 = productAssignments.some((a: any) => a.target === 'extra3');
    const showExtra4 = productAssignments.some((a: any) => a.target === 'extra4');

    const isTargetTaken = (target: string, currentItemId: string) => {
        return productAssignments.some((a: any) => a.target === target && a.quoteItemId !== currentItemId);
    };

    const handleChange = (field: string, value: string) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleAssignmentChange = (quoteItemId: string, target: string) => {
        let currentArr = data.productAssignments ? JSON.parse(data.productAssignments) : [];
        
        // 1. Rimuoviamo l'assegnazione precedente per questo specifico item (se esiste)
        currentArr = currentArr.filter((a: any) => a.quoteItemId !== quoteItemId);

        // 2. Aggiungiamo la nuova assegnazione (se non è l'opzione vuota)
        if (target) {
            currentArr.push({ quoteItemId, target });
        }
        
        const item = quoteItems.find((i: any) => i.id === quoteItemId);
        const itemTitle = item?.description || item?.name || '';
        
        const newData = { ...data, productAssignments: JSON.stringify(currentArr) };
        
        // Aggiorniamo il titolo della sezione di destinazione (se assegnata)
        if (target && itemTitle) {
            newData[`${target}_title`] = itemTitle.toUpperCase();
        }
        
        setData(newData);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await updateDeal(leadId, data);
        setSaving(false);

        if (res.success) {
            toast.success("Produzione salvata!");
        } else {
            toast.error("Errore salvataggio.");
        }
    };

    const AssignedProductInfo = ({ target }: { target: string }) => {
        const assignment = productAssignments.find((a: any) => a.target === target);
        if (!assignment) return null;
        const item = quoteItems.find((i: any) => i.id === assignment.quoteItemId);
        if (!item) return null;

        return (
            <div className="mb-4 p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                        <Package className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest leading-none mb-1">Voce Preventivo Assegnata</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{item.description || item.name}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Quantità</span>
                    <span className="text-sm font-black italic text-indigo-600 leading-none">{item.quantity} pz.</span>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-full mx-auto p-4 space-y-4 pb-20">
            {/* Header COMPATTO */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Scheda Tecnica Produzione</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild className="p-2 h-auto rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                            <Link href="/deals">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            {leadName}
                        </h1>
                        <div className="hidden print:flex flex-col mt-2">
                             <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-indigo-600 uppercase tracking-tighter italic">
                                    {data.deliveryType || 'Consegna'}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">
                                    {eventDate ? formatITDate(eventDate) : 'Data non impostata'}
                                </span>
                             </div>
                        </div>
                        <div className="flex items-center gap-2 print:hidden">
                            <QuotePreviewDialog quote={acceptedQuote} />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Vedi Prev.</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0 print:hidden">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tipologia & Location</span>
                        <div className="flex items-center gap-2">
                            <select 
                                value={data.deliveryType || ''} 
                                onChange={(e) => handleChange('deliveryType', e.target.value)}
                                className="text-[10px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 rounded-lg px-2 py-1 outline-none border border-indigo-100 cursor-pointer"
                            >
                                <option value="">Logistica...</option>
                                <option value="CONSEGNA">Consegna</option>
                                <option value="CONSEGNA IN LOCATION">In Location</option>
                                <option value="LIVE SHOW">Live Show</option>
                            </select>
                            <div className="flex items-center gap-1.5 text-slate-900 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <MapPin className="h-3 w-3 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-tight">{leadLocation || 'No Location'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={handlePrint}
                            className="rounded-2xl h-12 px-6 border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all flex items-center gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="font-black text-[10px] uppercase tracking-widest">Stampa</span>
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="rounded-2xl h-12 px-10 bg-slate-900 border-b-4 border-black hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Save className="h-4 w-4 text-emerald-400" />
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Salva Scheda</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Info Location per la STAMPA (visibile solo in stampa) */}
                <div className="hidden print:flex flex-col items-end">
                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{leadLocation}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location dell'evento</p>
                </div>
            </div>

            <Separator className="bg-slate-100 opacity-50" />

            {/* Stats Grids - ZERO BUCHI */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="rounded-[2rem] border-none shadow-sm bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dimensioni</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Ospiti</span>
                            <Input value={data.numGuests || ''} onChange={(e) => handleChange('numGuests', e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none font-black text-lg text-center" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Bomb.</span>
                            <Input value={data.numFavors || ''} onChange={(e) => handleChange('numFavors', e.target.value)} className="h-10 rounded-xl bg-indigo-50/50 border-none font-black text-lg text-center text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Timeline</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Arrivo</span>
                            <Input value={data.arrivalTime || ''} onChange={(e) => handleChange('arrivalTime', e.target.value)} placeholder="00:00" className="h-10 rounded-xl bg-slate-50 border-none font-black text-lg text-center" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Fine</span>
                            <Input value={data.endTime || ''} onChange={(e) => handleChange('endTime', e.target.value)} placeholder="00:00" className="h-10 rounded-xl bg-slate-50 border-none font-black text-lg text-center" />
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm bg-indigo-900 text-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                         <Sparkles className="h-3 w-3 text-indigo-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Attivazione Sezioni</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                         <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase opacity-40">Bomb.</span>
                             <div className="flex flex-wrap gap-2">
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showFavor2 ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-white/10 opacity-30 text-white")}>#2</span>
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showFavor3 ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-white/10 opacity-30 text-white")}>#3</span>
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showFavor4 ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-white/10 opacity-30 text-white")}>#4</span>
                             </div>
                         </div>
                         <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-black uppercase opacity-40">Extra</span>
                             <div className="flex flex-wrap gap-2">
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showExtra1 ? "border-indigo-400 bg-indigo-400/10 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]" : "border-white/10 opacity-30 text-white")}>E1</span>
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showExtra2 ? "border-indigo-400 bg-indigo-400/10 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]" : "border-white/10 opacity-30 text-white")}>E2</span>
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showExtra3 ? "border-indigo-400 bg-indigo-400/10 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]" : "border-white/10 opacity-30 text-white")}>E3</span>
                                <span className={cn("text-[12px] px-2 py-1 font-black rounded-lg border transition-all", showExtra4 ? "border-indigo-400 bg-indigo-400/10 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.2)]" : "border-white/10 opacity-30 text-white")}>E4</span>
                             </div>
                         </div>
                    </div>
                </Card>
            </div>

            {/* RIEPILOGO PREVENTIVO - SPOSTATA IN ALTO SUBITO SOTTO LE STATS */}
            {acceptedQuote && (
                <section className="space-y-4 py-2 border-y border-slate-100 bg-slate-50/20 px-2 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <ListChecks className="h-4 w-4 text-indigo-600" />
                        <h2 className="text-sm font-black italic text-slate-900 tracking-tighter uppercase">Assegnazione Prodotti Preventivo</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {quoteItems.map((item: any, idx: number) => {
                            const assignment = productAssignments.find((a: any) => a.quoteItemId === item.id);
                            const targetLabels: Record<string, string> = {
                                'favor1': '1° Bomb.',
                                'favor2': '2° Bomb.',
                                'favor3': '3° Bomb.',
                                'favor4': '4° Bomb.',
                                'extra1': 'Extra 1',
                                'extra2': 'Extra 2',
                                'extra3': 'Extra 3',
                                'extra4': 'Extra 4',
                            };

                            return (
                                <div key={idx} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 border border-slate-100">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex flex-col items-center justify-center text-white">
                                            <span className="text-[6px] font-black leading-none opacity-60 uppercase">Qty</span>
                                            <span className="text-sm font-black italic leading-none">{item.quantity}</span>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-400 print:hidden">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                                                <DialogHeader className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                                            <Package className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Dettaglio Prodotto</span>
                                                            <DialogTitle className="text-3xl font-black text-slate-900 leading-tight uppercase italic">{item.description || item.name || 'Prodotto'}</DialogTitle>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 w-20 bg-indigo-600 rounded-full" />
                                                </DialogHeader>
                                                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Quantità in Preventivo</span>
                                                    <span className="text-6xl font-black italic text-indigo-600 tracking-tighter">{item.quantity} pezzi</span>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-slate-900 truncate uppercase italic leading-tight">
                                            {item.description || item.name || 'Prodotto'}
                                        </p>
                                        {assignment && (
                                            <p className="text-[8px] font-black text-indigo-500 uppercase mt-0.5 animate-in fade-in zoom-in-95">
                                                Assegnato a: <span className="underline">{targetLabels[assignment.target]}</span>
                                            </p>
                                        )}
                                    </div>
                                    <select 
                                        className="text-[8px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 rounded-lg px-1 py-1 outline-none border-none cursor-pointer print:hidden"
                                        value={assignment?.target || ''}
                                        onChange={(e) => handleAssignmentChange(item.id, e.target.value)}
                                    >
                                        <option value="">ASSEGNA A...</option>
                                        {!isTargetTaken('favor1', item.id) && <option value="favor1">1° Bomb.</option>}
                                        {!isTargetTaken('favor2', item.id) && <option value="favor2">2° Bomb.</option>}
                                        {!isTargetTaken('favor3', item.id) && <option value="favor3">3° Bomb.</option>}
                                        {!isTargetTaken('favor4', item.id) && <option value="favor4">4° Bomb.</option>}
                                        {!isTargetTaken('extra1', item.id) && <option value="extra1">Extra 1</option>}
                                        {!isTargetTaken('extra2', item.id) && <option value="extra2">Extra 2</option>}
                                        {!isTargetTaken('extra3', item.id) && <option value="extra3">Extra 3</option>}
                                        {!isTargetTaken('extra4', item.id) && <option value="extra4">Extra 4</option>}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* SEZIONI PRODUZIONE - SERRATE */}
            <div className="space-y-6">
                {/* 1° BOMBONIERA */}
                <section className="space-y-2">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-6 w-1 bg-indigo-600 rounded-full" />
                        <Input 
                            value={data.favor1_title || ''}
                            onChange={(e) => handleChange('favor1_title', e.target.value)}
                            className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto w-full focus-visible:ring-0"
                            placeholder="Titolo 1° Bomboniera..."
                        />
                    </div>
                    <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-6">
                        <AssignedProductInfo target="favor1" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <DynamicField label="Colori" field="favor1_colors" value={data.favor1_colors || ''} onChange={handleChange} />
                            <DynamicField label="Grafiche" field="favor1_graphics" value={data.favor1_graphics || ''} onChange={handleChange} />
                            <DynamicField label="Stick" field="favor1_stick" value={data.favor1_stick || ''} onChange={handleChange} />
                            <DynamicField label="Profumi" field="favor1_scents" value={data.favor1_scents || ''} onChange={handleChange} />
                        </div>
                        <div className="bg-slate-50/50 rounded-2xl p-4 grid grid-cols-3 gap-4 border border-slate-100">
                            <DynamicField label="Nastro" field="pack1_ribbon" value={data.pack1_ribbon || ''} onChange={handleChange} />
                            <DynamicField label="Confetti" field="pack1_confetti" value={data.pack1_confetti || ''} onChange={handleChange} />
                            <DynamicField label="Grafica Pack" field="pack1_graphics" value={data.pack1_graphics || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 px-1">
                                <NotebookPen className="h-3 w-3 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Note Lavorazione #01</span>
                             </div>
                             <Textarea 
                                value={data.favor1_notes || ''}
                                onChange={(e) => handleChange('favor1_notes', e.target.value)}
                                className="rounded-2xl bg-slate-50 border-none font-bold p-4 min-h-[100px] text-sm text-slate-700 shadow-inner"
                                placeholder="Scrivi qui le note di produzione..."
                             />
                        </div>
                    </Card>
                </section>

                {/* 2°, 3°, 4° BOMBONIERA (CONDICIONALI) */}
                {[2, 3, 4].map(num => {
                    const isVisible = num === 2 ? showFavor2 : num === 3 ? showFavor3 : showFavor4;
                    if (!isVisible) return null;
                    return (
                        <section key={num} className="space-y-2 animate-in fade-in duration-300">
                             <div className="flex items-center gap-3 px-2">
                                <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                <Input 
                                    value={data[`favor${num}_title`] || ''}
                                    onChange={(e) => handleChange(`favor${num}_title`, e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto w-full focus-visible:ring-0"
                                    placeholder={`Titolo ${num}° Bomboniera...`}
                                />
                            </div>
                            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-6">
                                <AssignedProductInfo target={`favor${num}`} />
                                <div className="grid grid-cols-4 gap-4">
                                    <DynamicField label="Colori" field={`favor${num}_colors`} value={data[`favor${num}_colors`] || ''} onChange={handleChange} />
                                    <DynamicField label="Grafiche" field={`favor${num}_graphics`} value={data[`favor${num}_graphics`] || ''} onChange={handleChange} />
                                    <DynamicField label="Stick" field={`favor${num}_stick`} value={data[`favor${num}_stick`] || ''} onChange={handleChange} />
                                    <DynamicField label="Profumi" field={`favor${num}_scents`} value={data[`favor${num}_scents`] || ''} onChange={handleChange} />
                                </div>

                                {/* Campi Pack solo per 2 e 3 */}
                                {(num === 2 || num === 3) && (
                                    <div className="bg-slate-50/50 rounded-2xl p-4 grid grid-cols-3 gap-4 border border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                                        <DynamicField label="Nastro" field={`pack${num}_ribbon`} value={data[`pack${num}_ribbon`] || ''} onChange={handleChange} />
                                        <DynamicField label="Confetti" field={`pack${num}_confetti`} value={data[`pack${num}_confetti`] || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica Pack" field={`pack${num}_graphics`} value={data[`pack${num}_graphics`] || ''} onChange={handleChange} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <NotebookPen className="h-3 w-3 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Note Lavorazione #0{num}</span>
                                    </div>
                                    <Textarea 
                                        value={data[`favor${num}_notes`] || ''}
                                        onChange={(e) => handleChange(`favor${num}_notes`, e.target.value)}
                                        className="rounded-2xl bg-emerald-50/20 border-none font-bold p-4 min-h-[100px] text-sm shadow-inner"
                                    />
                                </div>
                            </Card>
                        </section>
                    );
                })}

                {/* EXTRAs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(num => {
                        const isVisible = num === 1 ? showExtra1 : num === 2 ? showExtra2 : num === 3 ? showExtra3 : showExtra4;
                        if (!isVisible) return null;
                        return (
                            <section key={num} className="space-y-2">
                                <div className="flex items-center gap-2 px-2">
                                    <Plus className="h-3 w-3 text-slate-400" />
                                    <Input 
                                        value={data[`extra${num}_title`] || ''}
                                        onChange={(e) => handleChange(`extra${num}_title`, e.target.value)}
                                        className="bg-transparent border-none text-sm font-black italic uppercase p-0 h-auto"
                                        placeholder={`Titolo Extra ${num}...`}
                                    />
                                </div>
                                <Card className="rounded-2xl border-none shadow-sm bg-white p-4">
                                    <AssignedProductInfo target={`extra${num}`} />
                                    <Textarea 
                                        value={data[`extra${num}_notes`] || ''}
                                        onChange={(e) => handleChange(`extra${num}_notes`, e.target.value)}
                                        className="rounded-xl bg-slate-50 border-none font-bold p-3 min-h-[80px] text-xs"
                                        placeholder="Note extra..."
                                    />
                                </Card>
                            </section>
                        );
                    })}
                </div>
            </div>

            {/* Stili CSS per la STAMPA - VERSIONE ULTRA-PULITA */}
            <style jsx global>{`
                @media print {
                    /* Reset Pagina */
                    @page { 
                        margin: 0.5cm; 
                        size: portrait;
                    }
                    body { 
                        background: white !important; 
                        color: black !important;
                        font-family: 'Inter', sans-serif !important;
                    }

                    /* Nascondi TUTTO il superfluo del CRM */
                    header, footer, nav, aside, 
                    .print\\:hidden, 
                    .SidebarProvider, 
                    [role="navigation"],
                    [data-sonner-toaster],
                    .fixed,
                    button,
                    .Plus,
                    .Trash2,
                    .Eye,
                    .ChevronRight,
                    select { 
                        display: none !important; 
                    }

                    /* Layout del Contenuto Principale */
                    .max-w-full { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                    }

                    /* Cards e Sezioni come righe di un documento */
                    .Card, section { 
                        border: none !important;
                        border-bottom: 1px solid #eee !important;
                        box-shadow: none !important; 
                        break-inside: avoid; 
                        margin-bottom: 20px !important;
                        padding: 0 !important;
                        background: transparent !important;
                    }

                    /* Header della stampa (Titolo e Location) */
                    h1 { 
                        font-size: 24pt !important; 
                        margin-bottom: 10px !important;
                    }
                    
                    /* Campi di input trasformati in testo piano */
                    input, textarea { 
                        border: none !important; 
                        background: transparent !important; 
                        padding: 0 !important; 
                        font-size: 11pt !important; 
                        height: auto !important; 
                        min-height: auto !important;
                        color: black !important;
                        font-weight: bold !important;
                    }
                    
                    textarea {
                        margin-top: 5px !important;
                    }

                    /* Labels */
                    label, span.text-\\[10px\\], span.text-\\[9px\\], span.text-\\[8px\\] {
                        color: #666 !important;
                        font-size: 8pt !important;
                        text-transform: uppercase !important;
                        font-weight: bold !important;
                    }

                    /* Colori e Badge per la stampa */
                    .bg-indigo-900, .bg-emerald-500, .bg-indigo-600 { 
                        background-color: transparent !important; 
                        color: black !important;
                        border: 1px solid #000 !important;
                        -webkit-print-color-adjust: exact; 
                    }
                    
                    .bg-slate-50, .bg-slate-50\\/20, .bg-indigo-50 {
                        background-color: transparent !important;
                        border: 1px solid #eee !important;
                    }

                    /* Tabelle e Griglie */
                    .grid { 
                        display: block !important; 
                    }
                    .grid-cols-2, .grid-cols-4, .grid-cols-3 {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        gap: 20px !important;
                    }
                    .grid-cols-2 > *, .grid-cols-4 > *, .grid-cols-3 > * {
                        flex: 1 !important;
                        min-width: 100px !important;
                        margin-bottom: 10px !important;
                    }

                    /* Forza visibilità sezioni anche se nascoste in UI */
                    .animate-in { opacity: 1 !important; transform: none !important; }
                }
            `}</style>
        </div>
    );
}
