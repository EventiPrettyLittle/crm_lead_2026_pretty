'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Save, FileText, Gift, Package, Sparkles, Clock, MapPin, Plus, Trash2, Layers, ListChecks, Eye, NotebookPen } from "lucide-react";
import { QuotePreviewDialog } from "@/components/quotes/quote-preview-dialog";

interface DealSheetProps {
    leadId: string;
    initialData: any;
    leadName: string;
    leadLocation?: string;
    acceptedQuote?: any;
}

// SPOSTATO FUORI per evitare perdita di focus durante la digitazione
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
    const values = value ? value.split(',') : [''];

    const updatePart = (index: number, newValue: string) => {
        const newValues = [...values];
        newValues[index] = newValue;
        onChange(field, newValues.join(', '));
    };

    const addRow = () => {
        onChange(field, [...values, ''].join(', '));
    };

    const removeRow = (index: number) => {
        if (values.length <= 1) {
            onChange(field, '');
            return;
        }
        const newValues = values.filter((_, i) => i !== index);
        onChange(field, newValues.join(', '));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</Label>
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
            <div className="space-y-1.5 pr-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                {values.map((v, i) => (
                    <div key={`${field}-${i}`} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
                        <Input 
                            value={v} 
                            placeholder={placeholder}
                            onChange={(e) => updatePart(i, e.target.value)} 
                            className={cn(
                                "h-10 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs focus:bg-white transition-all",
                                isAccent && "text-indigo-600"
                            )}
                        />
                        {values.length > 1 && (
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    removeRow(i);
                                }}
                                type="button"
                                className="p-2 text-slate-300 hover:text-rose-500 transition-all focus:outline-none"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export function DealSheet({ leadId, initialData, leadName, leadLocation, acceptedQuote }: DealSheetProps) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [showFavor2, setShowFavor2] = useState(!!(initialData.favor2_colors || initialData.pack2_ribbon));
    const [showFavor3, setShowFavor3] = useState(!!(initialData.favor3_colors || initialData.pack3_ribbon));
    const [showFavor4, setShowFavor4] = useState(!!(initialData.favor4_colors || initialData.pack4_ribbon));
    const [showExtra1, setShowExtra1] = useState(!!initialData.extra1_title);
    const [showExtra2, setShowExtra2] = useState(!!initialData.extra2_title);
    const [showExtra3, setShowExtra3] = useState(!!initialData.extra3_title);
    const [showExtra4, setShowExtra4] = useState(!!initialData.extra4_title);

    const quoteItems = acceptedQuote?.items ? (Array.isArray(acceptedQuote.items) ? acceptedQuote.items : []) : [];
    const productAssignments = data.productAssignments ? JSON.parse(data.productAssignments) : [];

    // Funzione per capire se una posizione è già presa da un ALTRO prodotto
    const isTargetTaken = (target: string, currentItemId: string) => {
        return productAssignments.some((a: any) => a.target === target && a.quoteItemId !== currentItemId);
    };

    // Automazione Live Show/Consegna basata sui prodotti del preventivo
    useEffect(() => {
        if (!acceptedQuote) return;
        
        const items = acceptedQuote?.items ? (Array.isArray(acceptedQuote.items) ? acceptedQuote.items : []) : [];
        const hasLiveShow = items.some((item: any) => 
            (item.description || item.name || "").toLowerCase().includes("live show")
        );

        if (hasLiveShow) {
            if (data.deliveryType !== 'LIVE SHOW') handleChange('deliveryType', 'LIVE SHOW');
        } else {
            // Se non c'è live show, il default è CONSEGNA (se non già impostato diversamente)
            if (!data.deliveryType || data.deliveryType === '') handleChange('deliveryType', 'CONSEGNA');
        }
    }, [acceptedQuote]);

    const handleChange = (field: string, value: string) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleAssignmentChange = (quoteItemId: string, target: string) => {
        const currentArr = data.productAssignments ? JSON.parse(data.productAssignments) : [];
        const index = currentArr.findIndex((a: any) => a.quoteItemId === quoteItemId);
        
        const item = quoteItems.find((i: any) => i.id === quoteItemId);
        const itemTitle = item?.description || item?.name || '';

        if (index >= 0) {
            currentArr[index].target = target;
        } else {
            currentArr.push({ quoteItemId, target });
        }
        
        // AUTO-UPDATE TITLE: Se assegniamo a una bomboniera, aggiorniamo il titolo della sezione
        const newData = { ...data, productAssignments: JSON.stringify(currentArr) };
        if (target && (target.startsWith('favor') || target.startsWith('extra')) && itemTitle) {
            newData[`${target}_title`] = itemTitle.toUpperCase();
        }
        
        setData(newData);
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await updateDeal(leadId, data);
        setLoading(false);

        if (res.success) {
            toast.success("Scheda tecnica aggiornata con successo! 💍");
        } else {
            toast.error("Errore durante il salvataggio: " + res.error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-24 pb-40 px-4">
            {/* Header & Main Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">Scheda Tecnica Produzione</span>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase flex items-center gap-4">
                        {leadName}
                        {acceptedQuote && (
                            <div className="flex items-center">
                                <QuotePreviewDialog quote={acceptedQuote} />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Vedi Prev.</span>
                            </div>
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipologia & Location</span>
                         <div className="flex flex-col items-end gap-1">
                            <select 
                                value={data.deliveryType || ''} 
                                onChange={(e) => handleChange('deliveryType', e.target.value)}
                                className="text-[11px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 rounded-lg px-2 py-1 outline-none border-none cursor-pointer"
                            >
                                <option value="">Seleziona Tipologia...</option>
                                <option value="CONSEGNA">Consegna</option>
                                <option value="CONSEGNA IN LOCATION">Consegna in Location</option>
                                <option value="LIVE SHOW">Live Show</option>
                            </select>
                            <div className="flex items-center gap-1.5 text-slate-900 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <MapPin className="h-3 w-3 text-indigo-500" />
                                <span className="text-[11px] font-black uppercase tracking-tight">{leadLocation || 'Location non specificata'}</span>
                            </div>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="rounded-2xl h-14 px-10 bg-slate-900 border-b-4 border-black hover:bg-slate-800 text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="p-1.5 bg-emerald-400 rounded-lg text-slate-900 shadow-sm group-hover:rotate-12 transition-transform">
                                    <Save className="h-4 w-4" />
                                </div>
                                <span className="font-black text-xs uppercase tracking-[0.2em]">Salva Scheda</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="bg-slate-100 opacity-50" />

            {/* Configurazione Evento - COMPACT & EFFICIENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Layers className="h-4 w-4" />
                        </div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             Dimensioni Evento
                        </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ospiti</span>
                            <Input value={data.numGuests || ''} onChange={(e) => handleChange('numGuests', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-black text-xl text-center shadow-inner" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bomboniere</span>
                            <Input value={data.numFavors || ''} onChange={(e) => handleChange('numFavors', e.target.value)} className="h-12 rounded-xl bg-indigo-50/50 border-none font-black text-xl text-center text-indigo-600 shadow-inner" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Clock className="h-4 w-4" />
                        </div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             Timeline Produzione
                        </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Arrivo Staff</span>
                            <Input value={data.arrivalTime || ''} onChange={(e) => handleChange('arrivalTime', e.target.value)} placeholder="00:00" className="h-12 rounded-xl bg-slate-50 border-none font-black text-xl text-center shadow-inner" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fine Evento</span>
                            <Input value={data.endTime || ''} onChange={(e) => handleChange('endTime', e.target.value)} placeholder="00:00" className="h-12 rounded-xl bg-slate-50 border-none font-black text-xl text-center shadow-inner" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-indigo-900 text-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Attivazione Sezioni</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none">Favor 2</span>
                             <Switch checked={showFavor2} onCheckedChange={setShowFavor2} className="scale-75 data-[state=checked]:bg-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none">Extra 1</span>
                             <Switch checked={showExtra1} onCheckedChange={setShowExtra1} className="scale-75" />
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none">Favor 3</span>
                             <Switch checked={showFavor3} onCheckedChange={setShowFavor3} className="scale-75" />
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none">Extra 2</span>
                             <Switch checked={showExtra2} onCheckedChange={setShowExtra2} className="scale-75" />
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none">Favor 4</span>
                             <Switch checked={showFavor4} onCheckedChange={setShowFavor4} className="scale-75" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* SEZIONI BOMBONIERE - COMPACTED SPACING */}
            <div className="space-y-12 mt-10">
                {/* PRIMA BOMBONIERA */}
                <section className="space-y-4">
                    <div className="flex items-center gap-4 px-6">
                        <div className="h-8 w-1 flex-none bg-indigo-600 rounded-full" />
                        <div className="flex-1">
                            <Input 
                                placeholder="Titolo Prima Bomboniera... (es: Mielino)"
                                value={data.favor1_title || ''}
                                onChange={(e) => handleChange('favor1_title', e.target.value)}
                                className="bg-transparent border-none text-2xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                            />
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-0">Configurazione Tecnica Produzione #01</p>
                        </div>
                    </div>
                    <Card className="rounded-[3rem] border-none shadow-[0_15px_40px_rgba(0,0,0,0.04)] bg-white overflow-hidden p-1">
                        <CardContent className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <DynamicField label="Colori" field="favor1_colors" value={data.favor1_colors || ''} onChange={handleChange} />
                                <DynamicField label="Grafiche" field="favor1_graphics" value={data.favor1_graphics || ''} onChange={handleChange} />
                                <DynamicField label="Stick" field="favor1_stick" value={data.favor1_stick || ''} onChange={handleChange} />
                                <DynamicField label="Profumi" field="favor1_scents" value={data.favor1_scents || ''} onChange={handleChange} />
                            </div>

                             {/* Packaging */}
                            <div className="bg-slate-50/80 rounded-[2rem] p-6 space-y-6 w-full border border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Dettagli Packaging & Confezione</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DynamicField label="Nastro" field="pack1_ribbon" value={data.pack1_ribbon || ''} onChange={handleChange} />
                                    <DynamicField label="Confetti" field="pack1_confetti" value={data.pack1_confetti || ''} onChange={handleChange} />
                                    <DynamicField label="Grafica Pack" field="pack1_graphics" value={data.pack1_graphics || ''} onChange={handleChange} />
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <NotebookPen className="h-5 w-5 text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Note Lab. Produzione</span>
                                </div>
                                <Textarea 
                                    placeholder="Annotazioni specifiche per la lavorazione..."
                                    value={data.favor1_notes || ''}
                                    onChange={(e) => handleChange('favor1_notes', e.target.value)}
                                    className="rounded-[2rem] bg-slate-50/50 border-none font-bold p-8 min-h-[140px] text-lg text-slate-700 focus:bg-white transition-all shadow-inner border-2 border-transparent focus:border-indigo-100"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* SECONDA BOMBONIERA (CONDIZIONALE) */}
                {showFavor2 && (
                    <section className="space-y-4 animate-in slide-in-from-top-6 duration-500">
                        <div className="flex items-center gap-4 px-6">
                            <div className="h-8 w-1 flex-none bg-emerald-500 rounded-full" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Seconda Bomboniera..."
                                    value={data.favor2_title || ''}
                                    onChange={(e) => handleChange('favor2_title', e.target.value)}
                                    className="bg-transparent border-none text-2xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-0">Configurazione Tecnica Produzione #02</p>
                            </div>
                        </div>
                        <Card className="rounded-[3rem] border-none shadow-[0_15px_40px_rgba(0,0,0,0.04)] bg-white overflow-hidden p-1 border-l-8 border-emerald-400">
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <DynamicField label="Colori" field="favor2_colors" value={data.favor2_colors || ''} onChange={handleChange} />
                                    <DynamicField label="Grafiche" field="favor2_graphics" value={data.favor2_graphics || ''} onChange={handleChange} />
                                    <DynamicField label="Stick" field="favor2_stick" value={data.favor2_stick || ''} onChange={handleChange} />
                                    <DynamicField label="Profumi" field="favor2_scents" value={data.favor2_scents || ''} onChange={handleChange} />
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <NotebookPen className="h-5 w-5 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 italic">Note Lab. Produzione #02</span>
                                    </div>
                                    <Textarea 
                                        placeholder="Annotazioni specifiche per la lavorazione..."
                                        value={data.favor2_notes || ''}
                                        onChange={(e) => handleChange('favor2_notes', e.target.value)}
                                        className="rounded-[2rem] bg-emerald-50/20 border-none font-bold p-8 min-h-[140px] text-lg text-slate-700 focus:bg-white transition-all shadow-inner"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* EXTRA SECTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* EXTRA 1 */}
                    {showExtra1 && (
                        <section className="space-y-4 animate-in slide-in-from-bottom-6 duration-500">
                             <div className="flex items-center gap-3 px-4">
                                <Plus className="h-4 w-4 text-slate-900" />
                                <Input 
                                    value={data.extra1_title || ''} 
                                    onChange={(e) => handleChange('extra1_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic uppercase tracking-tighter p-0 h-auto"
                                    placeholder="Titolo Prodotto Extra 1..."
                                />
                            </div>
                            <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6 border-l-4 border-slate-900">
                                <Textarea 
                                    value={data.extra1_notes || ''} 
                                    onChange={(e) => handleChange('extra1_notes', e.target.value)}
                                    placeholder="Note produzione extra..."
                                    className="rounded-xl bg-slate-50/50 border-none min-h-[100px] p-4 font-bold"
                                />
                            </Card>
                        </section>
                    )}
                </div>

                {/* NOTE FINALI */}
                <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden mt-10">
                    <CardHeader className="p-8 pb-0">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Note Generali Lavorazione / Richieste Cliente</Label>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Textarea 
                            rows={4} 
                            value={data.notes || ''} 
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Dettagli aggiuntivi..."
                            className="rounded-[2rem] bg-slate-50 border-none font-bold p-8 text-lg text-slate-700 focus:bg-white transition-all shadow-inner italic"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* RIEPILOGO PRODOTTI DA PREVENTIVO - MOVED TO BOTTOM AS REFERENCE */}
            {acceptedQuote && (
                <section className="space-y-6 mt-20 opacity-60 hover:opacity-100 transition-opacity duration-500 border-t border-slate-100 pt-10">
                    <div className="flex items-center gap-4 px-6">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                             <ListChecks className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">Riepilogo Preventivo</h2>
                        </div>
                    </div>
                    {quoteItems && quoteItems.length > 0 ? (
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-50/30 overflow-hidden">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quoteItems.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white rounded-[1.5rem] p-4 shadow-sm flex items-center gap-4 border border-slate-50 hover:border-indigo-100 transition-all group">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-600 flex flex-col items-center justify-center text-white shrink-0">
                                            <span className="text-[8px] font-black leading-none opacity-60">QTY</span>
                                            <span className="text-lg font-black italic leading-none">{item.quantity}</span>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[9px] font-black text-slate-400 uppercase truncate">
                                                {item.description || item.name || 'Prodotto'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col gap-1 items-end pl-4 ml-auto">
                                            <select 
                                                className="text-[9px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-600 rounded-lg px-2 py-1 outline-none border-none cursor-pointer"
                                                value={productAssignments.find((a: any) => a.quoteItemId === item.id)?.target || ''}
                                                onChange={(e) => handleAssignmentChange(item.id, e.target.value)}
                                            >
                                                <option value="">NON ASSEGNATO</option>
                                                {!isTargetTaken('favor1', item.id) && <option value="favor1">1° Bomb.</option>}
                                                {!isTargetTaken('favor2', item.id) && <option value="favor2">2° Bomb.</option>}
                                                {!isTargetTaken('favor3', item.id) && <option value="favor3">3° Bomb.</option>}
                                                {!isTargetTaken('favor4', item.id) && <option value="favor4">4° Bomb.</option>}
                                                {!isTargetTaken('extra1', item.id) && <option value="extra1">Extra 1</option>}
                                                {!isTargetTaken('extra2', item.id) && <option value="extra2">Extra 2</option>}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <div className="p-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Nessun dato preventivo.</div>
                    )}
                </section>
            )}
        </div>
    );
}
