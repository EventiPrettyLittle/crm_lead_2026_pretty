'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Phone, PhoneOff, FileText, XCircle, MessageSquare, Loader2, Sparkles, Plus, Calendar, Home, PhoneForwarded } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateLeadQuickAction } from "@/actions/lead-actions"
import { sendLeadWhatsAppAction } from "@/actions/whatsapp-actions"
import { Lead } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Select, SelectContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment' | null>(null);
    const [appointmentType, setAppointmentType] = useState<'showroom' | 'call'>('call');
    const [notes, setNotes] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [sendWhatsapp, setSendWhatsapp] = useState(true);

    const handleAction = async (type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment') => {
        setActionType(type);
        setIsOpen(true);
        setSendWhatsapp(true);
    };

    const submitAction = async () => {
        if (!actionType) return;
        setLoading(true);

        try {
            const stageMap = {
                'contacted': 'CONTATTATO',
                'no-answer': 'NON_RISPONDE',
                'preventivo': 'PREVENTIVO',
                'cancelled': 'CANCELLATO',
                'appointment': 'APPUNTAMENTO'
            };

            if (actionType === 'preventivo') {
                window.location.href = `/quotes?createFor=${lead.id}`;
                return;
            }

            const finalNotes = actionType === 'appointment' 
                ? `[${appointmentType.toUpperCase()}] Fissato per: ${appointmentDate}. ${notes}` 
                : notes;

            await updateLeadQuickAction(lead.id, actionType as any, {
                notes: finalNotes,
            });

            if (sendWhatsapp) {
                const waRes = await sendLeadWhatsAppAction(lead.id, actionType as any, {
                    appointmentDate: actionType === 'appointment' ? appointmentDate : undefined,
                    appointmentType: actionType === 'appointment' ? appointmentType : undefined
                });
                if (waRes.success) {
                    toast.success("Messaggio WhatsApp inviato!");
                }
            }

            toast.success(`Stato aggiornato a ${stageMap[actionType]}`);
            setIsOpen(false);
            setNotes("");
            setAppointmentDate("");
        } catch (error) {
            toast.error("Errore nell'aggiornamento dello stato");
        } finally {
            setLoading(false);
        }
    };

    const btnClass = showLabels 
        ? "h-9 px-3 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
        : "h-7 w-7 p-0 flex items-center justify-center rounded-lg transition-all";

    return (
        <div className="flex gap-1.5 items-center justify-end">
            <Button
                variant="ghost"
                className={cn(
                    "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm border border-emerald-100",
                    btnClass
                )}
                onClick={() => handleAction('contacted')}
                title="Contattato"
            >
                <Phone className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Contattato</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm border border-amber-100",
                    btnClass
                )}
                onClick={() => handleAction('no-answer')}
                title="Non Risponde"
            >
                <PhoneOff className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Non Risponde</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm border border-indigo-100",
                    btnClass
                )}
                onClick={() => handleAction('appointment')}
                title="Appuntamento"
            >
                <Calendar className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Appuntamento</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white shadow-sm border border-violet-100",
                    btnClass
                )}
                onClick={() => handleAction('preventivo')}
                title="Preventivo"
            >
                <FileText className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Preventivo</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white shadow-sm border border-slate-200",
                    btnClass
                )}
                onClick={() => handleAction('cancelled')}
                title="Cancellato"
            >
                <XCircle className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Cancellato</span>}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] p-8 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic text-slate-900 uppercase tracking-tight text-center">
                            {actionType === 'contacted' && "📞 Registra Contatto"}
                            {actionType === 'no-answer' && "🔇 Non Risponde"}
                            {actionType === 'appointment' && "📅 Prossimo Step"}
                            {actionType === 'preventivo' && "📑 Passa a Preventivo"}
                            {actionType === 'cancelled' && "❌ Cancella Lead"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {actionType === 'appointment' && (
                            <div className="space-y-4 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Tipo Appuntamento</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            type="button"
                                            variant={appointmentType === 'showroom' ? 'default' : 'outline'}
                                            onClick={() => setAppointmentType('showroom')}
                                            className={cn(
                                                "rounded-2xl h-12 font-bold uppercase text-[10px] flex items-center gap-2",
                                                appointmentType === 'showroom' ? "bg-indigo-600 sky-shadow" : "bg-white border-indigo-100 text-indigo-400"
                                            )}
                                        >
                                            <Home className="h-4 w-4" />
                                            Showroom
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant={appointmentType === 'call' ? 'default' : 'outline'}
                                            onClick={() => setAppointmentType('call')}
                                            className={cn(
                                                "rounded-2xl h-12 font-bold uppercase text-[10px] flex items-center gap-2",
                                                appointmentType === 'call' ? "bg-indigo-600 sky-shadow" : "bg-white border-indigo-100 text-indigo-400"
                                            )}
                                        >
                                            <PhoneForwarded className="h-4 w-4" />
                                            Richiamata
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Data e Ora</Label>
                                    <Input 
                                        type="datetime-local" 
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        className="rounded-2xl border-indigo-100 bg-white h-12 font-bold"
                                    />
                                </div>
                            </div>
                        )}

                        {actionType === 'preventivo' && (
                            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-200 flex flex-col items-center gap-4 text-center">
                                <Sparkles className="h-10 w-10 text-indigo-500" />
                                <div>
                                    <p className="text-sm font-black text-indigo-900 uppercase">Redirect Preventivo</p>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Ti porterò nella sezione preventivi per costruirlo ora</p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Note Attività</Label>
                            <Textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                placeholder="Scrivi qui eventuali dettagli..."
                                className="rounded-3xl border-slate-100 min-h-[100px] bg-slate-50/50 p-5 focus-visible:ring-indigo-500/20"
                            />
                        </div>

                        {actionType !== 'cancelled' && (
                            <div className="flex items-center space-x-4 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                                <Checkbox 
                                    id="whatsapp" 
                                    checked={sendWhatsapp} 
                                    onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                    className="h-6 w-6 rounded-xl border-emerald-200 data-[state=checked]:bg-emerald-500"
                                />
                                <Label htmlFor="whatsapp" className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    Invia Template WhatsApp
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Annulla</Button>
                        <Button 
                            onClick={submitAction} 
                            disabled={loading || (actionType === 'appointment' && !appointmentDate)}
                            className={cn(
                                "flex-[2] rounded-full h-14 px-8 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95",
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
