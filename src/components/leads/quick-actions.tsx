'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, PhoneOff, FileText, XCircle, MessageSquare, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateLeadQuickAction } from "@/actions/lead-actions"
import { sendLeadWhatsAppAction } from "@/actions/whatsapp-actions"
import { Lead } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [sendWhatsapp, setSendWhatsapp] = useState(true);

    const handleAction = async (type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled') => {
        setActionType(type);
        setIsOpen(true);
        setSendWhatsapp(type === 'contacted' || type === 'no-answer' || type === 'preventivo');
    };

    const submitAction = async () => {
        if (!actionType) return;
        setLoading(true);

        try {
            // Mapping to DB stages
            const stageMap = {
                'contacted': 'CONTATTATO',
                'no-answer': 'NON_RISPONDE',
                'preventivo': 'PREVENTIVO',
                'cancelled': 'CANCELLATO'
            };

            await updateLeadQuickAction(lead.id, actionType as any, {
                notes,
            });

            if (sendWhatsapp && (actionType === 'contacted' || actionType === 'no-answer')) {
                const waRes = await sendLeadWhatsAppAction(lead.id, actionType as any);
                if (waRes.success) {
                    toast.success("Messaggio WhatsApp inviato!");
                }
            }

            toast.success(`Stato aggiornato a ${stageMap[actionType]}`);
            setIsOpen(false);
            setNotes("");
        } catch (error) {
            toast.error("Errore nell'aggiornamento dello stato");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 items-center justify-end">
            <Button
                variant="ghost"
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl shadow-sm transition-all h-9 px-3 flex items-center gap-2 border border-emerald-100"
                onClick={() => handleAction('contacted')}
            >
                <Phone className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Contattato</span>
            </Button>

            <Button
                variant="ghost"
                className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl shadow-sm transition-all h-9 px-3 flex items-center gap-2 border border-amber-100"
                onClick={() => handleAction('no-answer')}
            >
                <PhoneOff className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Non Risponde</span>
            </Button>

            <Button
                variant="ghost"
                className="bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl shadow-sm transition-all h-9 px-3 flex items-center gap-2 border border-violet-100"
                onClick={() => handleAction('preventivo')}
            >
                <FileText className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Preventivo</span>
            </Button>

            <Button
                variant="ghost"
                className="bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white rounded-xl shadow-sm transition-all h-9 px-3 flex items-center gap-2 border border-slate-200"
                onClick={() => handleAction('cancelled')}
            >
                <XCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Cancellato</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">
                            {actionType === 'contacted' && "📞 Registra Contatto"}
                            {actionType === 'no-answer' && "🔇 Non Risponde"}
                            {actionType === 'preventivo' && "📑 Passa a Preventivo"}
                            {actionType === 'cancelled' && "❌ Cancella Lead"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Note Attività</Label>
                            <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Dettagli dell'azione effettuata..."
                                className="rounded-3xl border-slate-100 min-h-[120px] bg-slate-50/50 p-5 focus-visible:ring-indigo-500/20"
                            />
                        </div>

                        {(actionType === 'contacted' || actionType === 'no-answer') && (
                            <div className="flex items-center space-x-4 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                                <Checkbox 
                                    id="whatsapp" 
                                    checked={sendWhatsapp} 
                                    onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                    className="h-6 w-6 rounded-xl border-emerald-200 data-[state=checked]:bg-emerald-500"
                                />
                                <Label htmlFor="whatsapp" className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    Invia Notifica WhatsApp
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400">Annulla</Button>
                        <Button 
                            onClick={submitAction} 
                            disabled={loading}
                            className={cn(
                                "flex-[2] rounded-full h-14 px-8 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all",
                                actionType === 'cancelled' ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700",
                                "text-white"
                            )}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Stato"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
