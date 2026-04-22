'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updateDeal } from "@/actions/deals";
import { toast } from "sonner";
import { Save, FileText, Gift, Package, Sparkles, Clock, MapPin } from "lucide-react";

interface DealSheetProps {
    leadId: string;
    initialData: any;
    leadName: string;
}

export function DealSheet({ leadId, initialData, leadName }: DealSheetProps) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header / Info Generali */}
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Scheda Tecnica Produzione</span>
                            <CardTitle className="text-3xl font-black italic tracking-tighter">Event Details: {leadName}</CardTitle>
                        </div>
                        <Button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-8 font-bold gap-2 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Salvataggio..." : "Salva Scheda"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Location
                            </Label>
                            <Input value={data.location || ''} onChange={(e) => handleChange('location', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Numero Ospiti</Label>
                            <Input value={data.numGuests || ''} onChange={(e) => handleChange('numGuests', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Numero Bomboniere</Label>
                            <Input value={data.numFavors || ''} onChange={(e) => handleChange('numFavors', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Orario Arrivo
                            </Label>
                            <Input value={data.arrivalTime || ''} onChange={(e) => handleChange('arrivalTime', e.target.value)} placeholder="00:00" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Orario Fine
                            </Label>
                            <Input value={data.endTime || ''} onChange={(e) => handleChange('endTime', e.target.value)} placeholder="00:00" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PRIMA BOMBONIERA */}
            <div className="grid grid-cols-1 gap-8">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                <Gift className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-black italic text-slate-900 tracking-tighter">PRIMA BOMBONIERA</h3>
                        </div>
                    </div>
                    <CardContent className="p-8 space-y-8">
                        {/* Caratteristiche */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Colori</Label>
                                <Input value={data.favor1_colors || ''} onChange={(e) => handleChange('favor1_colors', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grafiche</Label>
                                <Input value={data.favor1_graphics || ''} onChange={(e) => handleChange('favor1_graphics', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stick</Label>
                                <Input value={data.favor1_stick || ''} onChange={(e) => handleChange('favor1_stick', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Profumi</Label>
                                <Input value={data.favor1_scents || ''} onChange={(e) => handleChange('favor1_scents', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                        </div>

                        {/* Packaging */}
                        <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Pack Prima Bomboniera</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nastro</Label>
                                    <Input value={data.pack1_ribbon || ''} onChange={(e) => handleChange('pack1_ribbon', e.target.value)} className="h-12 rounded-xl bg-white border-slate-100 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Confetti</Label>
                                    <Input value={data.pack1_confetti || ''} onChange={(e) => handleChange('pack1_confetti', e.target.value)} className="h-12 rounded-xl bg-white border-slate-100 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grafica Pack</Label>
                                    <Input value={data.pack1_graphics || ''} onChange={(e) => handleChange('pack1_graphics', e.target.value)} className="h-12 rounded-xl bg-white border-slate-100 font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* Accessori 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessori 1: Prodotto</Label>
                                <Input value={data.acc1_product || ''} onChange={(e) => handleChange('acc1_product', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-indigo-600" />
                            </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessori 1: Colori</Label>
                                <Input value={data.acc1_colors || ''} onChange={(e) => handleChange('acc1_colors', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessori 1: Grafica</Label>
                                <Input value={data.acc1_graphics || ''} onChange={(e) => handleChange('acc1_graphics', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                            className="rounded-2xl bg-slate-50 border-slate-100 font-bold p-6 text-slate-700"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
