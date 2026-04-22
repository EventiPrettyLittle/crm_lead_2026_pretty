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
import { updateDeal } from "@/actions/deals";
import { toast } from "sonner";
import { Save, FileText, Gift, Package, Sparkles, Clock, MapPin, Plus, Trash2, Layers } from "lucide-react";

interface DealSheetProps {
    leadId: string;
    initialData: any;
    leadName: string;
    leadLocation?: string;
}

export function DealSheet({ leadId, initialData, leadName, leadLocation }: DealSheetProps) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [showFavor2, setShowFavor2] = useState(!!(initialData.favor2_colors || initialData.pack2_ribbon));
    const [showFavor3, setShowFavor3] = useState(!!(initialData.favor3_colors || initialData.pack3_ribbon));

    const handleChange = (field: string, value: string) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
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

    const DynamicField = ({ label, field, value, placeholder = "", isAccent = false }: { label: string, field: string, value: string, placeholder?: string, isAccent?: boolean }) => {
        const values = value ? value.split(',').map(v => v.trim()) : [''];

        const updatePart = (index: number, newValue: string) => {
            const newValues = [...values];
            newValues[index] = newValue;
            handleChange(field, newValues.join(', '));
        };

        const addRow = () => {
            handleChange(field, [...values, ''].join(', '));
        };

        const removeRow = (index: number) => {
            if (values.length <= 1) {
                handleChange(field, '');
                return;
            }
            const newValues = values.filter((_, i) => i !== index);
            handleChange(field, newValues.join(', '));
        };

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</Label>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={addRow}
                        className="h-5 w-5 p-0 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                        <Plus className="h-2.5 w-2.5" />
                    </Button>
                </div>
                <div className="space-y-1.5 pr-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {values.map((v, i) => (
                        <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
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
                                    onClick={() => removeRow(i)}
                                    type="button"
                                    className="p-2 text-slate-300 hover:text-rose-500 transition-all"
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

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
            {/* Header & Main Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">Scheda Tecnica Produzione</span>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
                        {leadName}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location Evento</span>
                         <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-600" />
                            {leadLocation || 'Location non definita'}
                         </span>
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

                <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-50/50 p-6 flex flex-col justify-center items-center gap-3">
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">2° Bomboniera</span>
                         <Switch checked={showFavor2} onCheckedChange={setShowFavor2} />
                    </div>
                    <div className="flex items-center gap-3 w-full justify-between">
                         <span className="text-[10px] font-black uppercase text-indigo-900/40 tracking-widest">3° Bomboniera</span>
                         <Switch checked={showFavor3} onCheckedChange={setShowFavor3} />
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status Lavorazione</span>
                    <select 
                        value={data.status || 'IN_LAVORAZIONE'} 
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="bg-transparent text-white font-black italic uppercase text-lg outline-none cursor-pointer hover:text-emerald-400 transition-colors"
                    >
                        <option value="IN_LAVORAZIONE" className="bg-slate-900 text-white">In Lavorazione</option>
                        <option value="COMPLETATO" className="bg-slate-900 text-emerald-400">Completato</option>
                        <option value="APPROVATO" className="bg-slate-900 text-indigo-400">Approvato</option>
                    </select>
                </Card>
            </div>

            {/* SEZIONI BOMBONIERE */}
            <div className="space-y-10">
                {/* PRIMA BOMBONIERA */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-4">
                        <Gift className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-black italic text-slate-900 tracking-tighter uppercase underline decoration-indigo-200 decoration-4 underline-offset-4">Prima Bomboniera</h2>
                    </div>
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <DynamicField label="Colori" field="favor1_colors" value={data.favor1_colors || ''} />
                            <DynamicField label="Grafiche" field="favor1_graphics" value={data.favor1_graphics || ''} />
                            <DynamicField label="Stick" field="favor1_stick" value={data.favor1_stick || ''} />
                            <DynamicField label="Profumi" field="favor1_scents" value={data.favor1_scents || ''} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             {/* Packaging */}
                            <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-4 w-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Configurazione Packaging</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DynamicField label="Nastro" field="pack1_ribbon" value={data.pack1_ribbon || ''} />
                                    <DynamicField label="Confetti" field="pack1_confetti" value={data.pack1_confetti || ''} />
                                    <DynamicField label="Grafica Pack" field="pack1_graphics" value={data.pack1_graphics || ''} />
                                </div>
                            </div>

                            {/* Accessori 1 */}
                            <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Layers className="h-4 w-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Accessori & Opzioni 1</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DynamicField label="Prodotto" field="acc1_product" value={data.acc1_product || ''} isAccent />
                                    <DynamicField label="Colori" field="acc1_colors" value={data.acc1_colors || ''} />
                                    <DynamicField label="Grafica" field="acc1_graphics" value={data.acc1_graphics || ''} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Accessori 2 */}
                        <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="h-4 w-4 text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Accessori & Opzioni 2</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <DynamicField label="Prodotto 2" field="acc2_product" value={data.acc2_product || ''} isAccent />
                                <DynamicField label="Colori 2" field="acc2_colors" value={data.acc2_colors || ''} />
                                <DynamicField label="Grafica 2" field="acc2_graphics" value={data.acc2_graphics || ''} />
                            </div>
                        </div>
                    </CardContent>
                </section>

                {/* SECONDA BOMBONIERA (CONDIZIONALE) */}
                {showFavor2 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Gift className="h-5 w-5 text-emerald-500" />
                            <h2 className="text-xl font-black italic text-slate-900 tracking-tighter uppercase underline decoration-emerald-100 decoration-4 underline-offset-4">Seconda Bomboniera</h2>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 space-y-10 border-l-8 border-emerald-400">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <DynamicField label="Colori" field="favor2_colors" value={data.favor2_colors || ''} />
                                <DynamicField label="Grafiche" field="favor2_graphics" value={data.favor2_graphics || ''} />
                                <DynamicField label="Stick" field="favor2_stick" value={data.favor2_stick || ''} />
                                <DynamicField label="Profumi" field="favor2_scents" value={data.favor2_scents || ''} />
                            </div>
                            <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DynamicField label="Nastro" field="pack2_ribbon" value={data.pack2_ribbon || ''} />
                                    <DynamicField label="Confetti" field="pack2_confetti" value={data.pack2_confetti || ''} />
                                    <DynamicField label="Grafica Pack" field="pack2_graphics" value={data.pack2_graphics || ''} />
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                {/* TERZA BOMBONIERA (CONDIZIONALE) */}
                {showFavor3 && (
                    <section className="space-y-4 animate-in slide-in-from-top-10 duration-500">
                        <div className="flex items-center gap-3 px-4">
                            <Gift className="h-5 w-5 text-amber-500" />
                            <h2 className="text-xl font-black italic text-slate-900 tracking-tighter uppercase underline decoration-amber-100 decoration-4 underline-offset-4">Terza Bomboniera</h2>
                        </div>
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 space-y-10 border-l-8 border-amber-400">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <DynamicField label="Colori" field="favor3_colors" value={data.favor3_colors || ''} />
                                <DynamicField label="Grafiche" field="favor3_graphics" value={data.favor3_graphics || ''} />
                                <DynamicField label="Stick" field="favor3_stick" value={data.favor3_stick || ''} />
                                <DynamicField label="Profumi" field="favor3_scents" value={data.favor3_scents || ''} />
                            </div>
                            <div className="bg-slate-50/50 rounded-[2rem] p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <DynamicField label="Nastro" field="pack3_ribbon" value={data.pack3_ribbon || ''} />
                                    <DynamicField label="Confetti" field="pack3_confetti" value={data.pack3_confetti || ''} />
                                    <DynamicField label="Grafica Pack" field="pack3_graphics" value={data.pack3_graphics || ''} />
                                </div>
                            </div>
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
