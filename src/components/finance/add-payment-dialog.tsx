'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Euro, CreditCard, Banknote, Calendar } from "lucide-react";
import { addPayment } from "@/actions/finance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AddPaymentDialog({ quoteId, leadName }: { quoteId: string, leadName: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        method: 'BONIFICO',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await addPayment(quoteId, Number(formData.amount), formData.method, formData.notes, undefined, new Date(formData.date));
            if (res.success) {
                toast.success("Pagamento registrato");
                setOpen(false);
                setFormData({ 
                    amount: '', 
                    method: 'BONIFICO', 
                    notes: '', 
                    date: new Date().toISOString().split('T')[0] 
                });
                router.refresh();
            } else {
                toast.error("Errore: " + (res as any).error);
            }
        } catch (error) {
            toast.error("Errore durante la registrazione");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-100 transition-all hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" /> Nuovo Pagamento
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100 space-y-2">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                             <Euro className="h-5 w-5" />
                         </div>
                         <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 italic uppercase italic">Registra Acconto</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none mt-1">Per: {leadName}</DialogDescription>
                         </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Importo Versato</Label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-black text-lg focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Pagamento</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        required
                                        type="date"
                                        className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50 font-black focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Metodo di Pagamento</Label>
                            <Select 
                                value={formData.method} 
                                onValueChange={(val) => setFormData({...formData, method: val})}
                            >
                                <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:ring-indigo-500 hover:bg-white transition-all shadow-sm">
                                    <SelectValue placeholder="Seleziona metodo" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="BONIFICO" className="rounded-xl font-bold">Bonifico Bancario</SelectItem>
                                    <SelectItem value="CONTANTI" className="rounded-xl font-bold">Contanti</SelectItem>
                                    <SelectItem value="STRIPE" className="rounded-xl font-bold">Stripe / Carta</SelectItem>
                                    <SelectItem value="POS" className="rounded-xl font-bold">POS Fisico</SelectItem>
                                    <SelectItem value="ALTRO" className="rounded-xl font-bold">Altro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Note (Opzionale)</Label>
                             <Input
                                placeholder="Esempio: Acconto confirmazione, Saldo finale, ecc."
                                className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                             />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? "Registrazione in corso..." : "CONFERMA PAGAMENTO"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
