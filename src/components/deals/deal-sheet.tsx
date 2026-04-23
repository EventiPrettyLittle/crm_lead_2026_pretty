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
import { Save, FileText, Gift, Package, Sparkles, Clock, MapPin, Plus, Trash2, Layers, ListChecks, Eye } from "lucide-react";
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
        if (target && target.startsWith('favor') && itemTitle) {
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
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
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
                            <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                                {leadLocation || 'Location non definita'}
                            </span>
                         </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-10 font-bold gap-3 transition-all shadow-2xl hover:scale-105 active:scale-95"
                    >
                        <Save className="h-5 w-5 text-emerald-400" />
                        {loading ? "Salvataggio..." : "SALVA SCHEDA"}
                    </Button>
                </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Configurazione Evento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                         Ospiti & Bomboniere
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ospiti</span>
                            <Input value={data.numGuests || ''} onChange={(e) => handleChange('numGuests', e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tot. Bomb.</span>
                            <Input value={data.numFavors || ''} onChange={(e) => handleChange('numFavors', e.target.value)} className="h-10 rounded-xl bg-slate-50 border-none font-black text-center text-indigo-600" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                         Orari Timeline
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Arrivo Staff</span>
                            <Input value={data.arrivalTime || ''} onChange={(e) => handleChange('arrivalTime', e.target.value)} placeholder="00:00" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fine Evento</span>
                            <Input value={data.endTime || ''} onChange={(e) => handleChange('endTime', e.target.value)} placeholder="00:00" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-50/50 p-6 grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">2° Bomboniera</span>
                         <Switch checked={showFavor2} onCheckedChange={setShowFavor2} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">Extra 1</span>
                         <Switch checked={showExtra1} onCheckedChange={setShowExtra1} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">3° Bomboniera</span>
                         <Switch checked={showFavor3} onCheckedChange={setShowFavor3} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">Extra 2</span>
                         <Switch checked={showExtra2} onCheckedChange={setShowExtra2} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">4° Bomboniera</span>
                         <Switch checked={showFavor4} onCheckedChange={setShowFavor4} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">Extra 3</span>
                         <Switch checked={showExtra3} onCheckedChange={setShowExtra3} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest hidden md:block"></span>
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">Extra 4</span>
                         <Switch checked={showExtra4} onCheckedChange={setShowExtra4} />
                    </div>
                </Card>
            </div>
            
            {/* RIEPILOGO PRODOTTI DA PREVENTIVO */}
            {acceptedQuote && (
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 px-4">
                        <ListChecks className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-black italic text-slate-900 tracking-tighter uppercase">Prodotti da Preventivo #{acceptedQuote.number || '---'}</h2>
                    </div>
                    {quoteItems && quoteItems.length > 0 ? (
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-indigo-50/50 overflow-hidden">
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {quoteItems.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white rounded-[1.5rem] p-4 shadow-sm flex items-center gap-4 border-2 border-transparent hover:border-indigo-200 transition-all group">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-600 flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                                            <span className="text-[10px] font-black leading-none opacity-60">QTY</span>
                                            <span className="text-lg font-black leading-none italic">{item.quantity}</span>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Descrizione Prodotto</p>
                                            <p className="text-xs font-black text-slate-900 truncate uppercase italic leading-tight">
                                                {item.description || item.name || 'Prodotto'}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col gap-1 items-end border-l-2 border-slate-50 pl-4 ml-auto">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">Assegna a:</p>
                                            <select 
                                                className="text-[9px] font-black uppercase tracking-tighter bg-indigo-50/50 text-indigo-600 rounded-lg px-2 py-1 outline-none border-none cursor-pointer hover:bg-indigo-100 transition-colors"
                                                value={productAssignments.find((a: any) => a.quoteItemId === item.id)?.target || ''}
                                                onChange={(e) => handleAssignmentChange(item.id, e.target.value)}
                                            >
                                                <option value="">NON ASSEGNATO</option>
                                                {!isTargetTaken('favor1', item.id) && <option value="favor1">1° Bomboniera</option>}
                                                {!isTargetTaken('favor2', item.id) && <option value="favor2">2° Bomboniera</option>}
                                                {!isTargetTaken('favor3', item.id) && <option value="favor3">3° Bomboniera</option>}
                                                {!isTargetTaken('favor4', item.id) && <option value="favor4">4° Bomboniera</option>}
                                                {!isTargetTaken('extra1', item.id) && <option value="extra1">Extra 1</option>}
                                                {!isTargetTaken('extra2', item.id) && <option value="extra2">Extra 2</option>}
                                                {!isTargetTaken('extra3', item.id) && <option value="extra3">Extra 3</option>}
                                                {!isTargetTaken('extra4', item.id) && <option value="extra4">Extra 4</option>}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-100/50 p-10 text-center flex flex-col items-center justify-center gap-2">
                             <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <ListChecks className="h-5 w-5" />
                             </div>
                             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                                Caricamento prodotti in corso o nessun prodotto trovato nel preventivo #{acceptedQuote.number}...
                             </p>
                        </Card>
                    )}
                </section>
            )}

            {/* SEZIONI BOMBONIERE */}
            <div className="space-y-10">
                {/* PRIMA BOMBONIERA */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-4">
                        <Gift className="h-5 w-5 text-indigo-600" />
                        <div className="flex-1">
                            <Input 
                                placeholder="Titolo Prima Bomboniera... (es: Mielino)"
                                value={data.favor1_title || ''}
                                onChange={(e) => handleChange('favor1_title', e.target.value)}
                                className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                            />
                            <div className="h-1 w-20 bg-indigo-200 mt-1" />
                        </div>
                    </div>
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <DynamicField label="Colori" field="favor1_colors" value={data.favor1_colors || ''} onChange={handleChange} />
                                <DynamicField label="Grafiche" field="favor1_graphics" value={data.favor1_graphics || ''} onChange={handleChange} />
                                <DynamicField label="Stick" field="favor1_stick" value={data.favor1_stick || ''} onChange={handleChange} />
                                <DynamicField label="Profumi" field="favor1_scents" value={data.favor1_scents || ''} onChange={handleChange} />
                            </div>

                                 {/* Packaging */}
                                <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6 w-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-4 w-4 text-indigo-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Configurazione Packaging</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DynamicField label="Nastro" field="pack1_ribbon" value={data.pack1_ribbon || ''} onChange={handleChange} />
                                        <DynamicField label="Confetti" field="pack1_confetti" value={data.pack1_confetti || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica Pack" field="pack1_graphics" value={data.pack1_graphics || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
                        </CardContent>
                    </Card>
                </section>

                {/* SECONDA BOMBONIERA (CONDIZIONALE) */}
                {showFavor2 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Gift className="h-5 w-5 text-emerald-500" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Seconda Bomboniera..."
                                    value={data.favor2_title || ''}
                                    onChange={(e) => handleChange('favor2_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-emerald-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-emerald-400">
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <DynamicField label="Colori" field="favor2_colors" value={data.favor2_colors || ''} onChange={handleChange} />
                                    <DynamicField label="Grafiche" field="favor2_graphics" value={data.favor2_graphics || ''} onChange={handleChange} />
                                    <DynamicField label="Stick" field="favor2_stick" value={data.favor2_stick || ''} onChange={handleChange} />
                                    <DynamicField label="Profumi" field="favor2_scents" value={data.favor2_scents || ''} onChange={handleChange} />
                                </div>
                                <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DynamicField label="Nastro" field="pack2_ribbon" value={data.pack2_ribbon || ''} onChange={handleChange} />
                                        <DynamicField label="Confetti" field="pack2_confetti" value={data.pack2_confetti || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica Pack" field="pack2_graphics" value={data.pack2_graphics || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* TERZA BOMBONIERA (CONDIZIONALE) */}
                {showFavor3 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Gift className="h-5 w-5 text-amber-500" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Terza Bomboniera..."
                                    value={data.favor3_title || ''}
                                    onChange={(e) => handleChange('favor3_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-amber-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-amber-400">
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <DynamicField label="Colori" field="favor3_colors" value={data.favor3_colors || ''} onChange={handleChange} />
                                    <DynamicField label="Grafiche" field="favor3_graphics" value={data.favor3_graphics || ''} onChange={handleChange} />
                                    <DynamicField label="Stick" field="favor3_stick" value={data.favor3_stick || ''} onChange={handleChange} />
                                    <DynamicField label="Profumi" field="favor3_scents" value={data.favor3_scents || ''} onChange={handleChange} />
                                </div>
                                <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DynamicField label="Nastro" field="pack3_ribbon" value={data.pack3_ribbon || ''} onChange={handleChange} />
                                        <DynamicField label="Confetti" field="pack3_confetti" value={data.pack3_confetti || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica Pack" field="pack3_graphics" value={data.pack3_graphics || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* QUARTA BOMBONIERA (CONDIZIONALE) */}
                {showFavor4 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Gift className="h-5 w-5 text-indigo-500" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Quarta Bomboniera..."
                                    value={data.favor4_title || ''}
                                    onChange={(e) => handleChange('favor4_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-indigo-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-indigo-400">
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <DynamicField label="Colori" field="favor4_colors" value={data.favor4_colors || ''} onChange={handleChange} />
                                    <DynamicField label="Grafiche" field="favor4_graphics" value={data.favor4_graphics || ''} onChange={handleChange} />
                                    <DynamicField label="Stick" field="favor4_stick" value={data.favor4_stick || ''} onChange={handleChange} />
                                    <DynamicField label="Profumi" field="favor4_scents" value={data.favor4_scents || ''} onChange={handleChange} />
                                </div>
                                <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DynamicField label="Nastro" field="pack4_ribbon" value={data.pack4_ribbon || ''} onChange={handleChange} />
                                        <DynamicField label="Confetti" field="pack4_confetti" value={data.pack4_confetti || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica Pack" field="pack4_graphics" value={data.pack4_graphics || ''} onChange={handleChange} />
                                    </div>
                                </div>
                                {/* Accessori 3 */}
                                <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Layers className="h-4 w-4 text-indigo-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Accessori & Opzioni 3</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DynamicField label="Prodotto 3" field="acc3_product" value={data.acc3_product || ''} onChange={handleChange} isAccent />
                                        <DynamicField label="Colori 3" field="acc3_colors" value={data.acc3_colors || ''} onChange={handleChange} />
                                        <DynamicField label="Grafica 3" field="acc3_graphics" value={data.acc3_graphics || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}
                {/* EXTRA 1 (CONDIZIONALE) */}
                {showExtra1 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Extra 1..."
                                    value={data.extra1_title || ''}
                                    onChange={(e) => handleChange('extra1_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-indigo-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-slate-900">
                            <CardContent className="p-8">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-4 block">Note Extra 1</Label>
                                <Textarea 
                                    placeholder="Annotazioni particolari per questo prodotto extra..."
                                    value={data.extra1_notes || ''}
                                    onChange={(e) => handleChange('extra1_notes', e.target.value)}
                                    className="rounded-2xl bg-slate-50 border-none font-bold p-6 min-h-[100px]"
                                />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* EXTRA 2 (CONDIZIONALE) */}
                {showExtra2 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Extra 2..."
                                    value={data.extra2_title || ''}
                                    onChange={(e) => handleChange('extra2_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-indigo-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-slate-900">
                            <CardContent className="p-8">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-4 block">Note Extra 2</Label>
                                <Textarea 
                                    placeholder="Annotazioni particolari per questo prodotto extra..."
                                    value={data.extra2_notes || ''}
                                    onChange={(e) => handleChange('extra2_notes', e.target.value)}
                                    className="rounded-2xl bg-slate-50 border-none font-bold p-6 min-h-[100px]"
                                />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* EXTRA 3 (CONDIZIONALE) */}
                {showExtra3 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Extra 3..."
                                    value={data.extra3_title || ''}
                                    onChange={(e) => handleChange('extra3_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-indigo-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-slate-900">
                            <CardContent className="p-8">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-4 block">Note Extra 3</Label>
                                <Textarea 
                                    placeholder="Annotazioni particolari per questo prodotto extra..."
                                    value={data.extra3_notes || ''}
                                    onChange={(e) => handleChange('extra3_notes', e.target.value)}
                                    className="rounded-2xl bg-slate-50 border-none font-bold p-6 min-h-[100px]"
                                />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* EXTRA 4 (CONDIZIONALE) */}
                {showExtra4 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            <div className="flex-1">
                                <Input 
                                    placeholder="Titolo Extra 4..."
                                    value={data.extra4_title || ''}
                                    onChange={(e) => handleChange('extra4_title', e.target.value)}
                                    className="bg-transparent border-none text-xl font-black italic text-slate-900 tracking-tighter uppercase p-0 h-auto focus-visible:ring-0"
                                />
                                <div className="h-1 w-20 bg-indigo-100 mt-1" />
                            </div>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden border-l-8 border-slate-900">
                            <CardContent className="p-8">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-4 block">Note Extra 4</Label>
                                <Textarea 
                                    placeholder="Annotazioni particolari per questo prodotto extra..."
                                    value={data.extra4_notes || ''}
                                    onChange={(e) => handleChange('extra4_notes', e.target.value)}
                                    className="rounded-2xl bg-slate-50 border-none font-bold p-6 min-h-[100px]"
                                />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* NOTE FINALI */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Note di Produzione / Richieste Particolari</Label>
                    </CardHeader>
                    <CardContent className="p-8">
                        <Textarea 
                            rows={5} 
                            value={data.notes || ''} 
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Inserisci qui eventuali dettagli aggiuntivi..."
                            className="rounded-2xl bg-slate-50 border-slate-100 font-bold p-6 text-slate-700 focus:bg-white transition-all shadow-inner"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
