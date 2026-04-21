'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Phone, PhoneOff, FileText, XCircle, MessageSquare, Loader2, Sparkles, Plus, Calendar, Home, PhoneForwarded, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateLeadQuickAction } from "@/actions/lead-actions"
import { sendLeadWhatsAppAction } from "@/actions/whatsapp-actions"
import { Lead } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment' | null>(null);
    const [appointmentType, setAppointmentType] = useState<'showroom' | 'call' | 'video'>('showroom');
    const [appointmentTitle, setAppointmentTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentHour, setAppointmentHour] = useState("10:00");
    const [reminderDate, setReminderDate] = useState("");
    const [reminderHour, setReminderHour] = useState("09:00");
    const [loading, setLoading] = useState(false);
    const [sendWhatsapp, setSendWhatsapp] = useState(true);
    const [isTitleManual, setIsTitleManual] = useState(false);

    // Auto-generate title
    useEffect(() => {
        if (!isTitleManual && actionType === 'appointment') {
            const typeLabels = {
                showroom: "APPUNTAMENTO SHOWROOM",
                call: "RICHIAMATA",
                video: "VIDEOCHIAMATA"
            };
            setAppointmentTitle(`${typeLabels[appointmentType]} - ${lead.firstName} ${lead.lastName}`);
        }
    }, [appointmentType, actionType, lead, isTitleManual]);

    const handleAction = async (type: 'contacted' | 'no-answer' | 'preventivo' | 'cancelled' | 'appointment') => {
        setActionType(type);
        setIsOpen(true);
        setSendWhatsapp(true);
        setIsTitleManual(false); // Reset manual flag on new action
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
                // Save state first, then redirect
                await updateLeadQuickAction(lead.id, 'preventivo', { notes });
                window.location.href = `/quotes?createFor=${lead.id}`;
                return;
            }

            const combinedDateTime = actionType === 'appointment' && appointmentDate 
                ? `${appointmentDate}T${appointmentHour}` 
                : appointmentDate;

            const finalNotes = actionType === 'appointment' 
                ? `[${appointmentType.toUpperCase()}] ${appointmentTitle ? appointmentTitle + ' - ' : ''} Fissato per: ${combinedDateTime}. ${notes}` 
                : notes;

            const reminderDateTime = (actionType === 'no-answer' && reminderDate)
                ? new Date(`${reminderDate}T${reminderHour}`)
                : undefined;

            // 1. PRIMA SALVIAMO LO STATO (OPERAZIONE CRITICA)
            const res = await updateLeadQuickAction(lead.id, actionType as any, {
                notes: finalNotes,
                nextFollowup: reminderDateTime,
                appointmentDate: actionType === 'appointment' ? combinedDateTime : undefined,
                appointmentType: actionType === 'appointment' ? appointmentType : undefined,
                title: actionType === 'appointment' ? appointmentTitle : undefined
            });

            if (!res.success) {
                toast.error(`ERRORE SALVATAGGIO: ${res.error || 'Il server ha rifiutato la modifica'}`);
                setLoading(false);
                return;
            }

            toast.success("Database aggiornato!");

            // 2. POI TENTIAMO WHATSAPP (SE FALLISCE NON IMPORTA)
            if (sendWhatsapp && (actionType === 'contacted' || actionType === 'no-answer' || actionType === 'appointment')) {
                try {
                    const waRes = await sendLeadWhatsAppAction(lead.id, actionType, {
                        date: actionType === 'appointment' ? combinedDateTime : undefined,
                        type: actionType === 'appointment' ? appointmentType : undefined
                    });
                    if (waRes.success) toast.success("WhatsApp inviato correttamente");
                    else toast.error(`WhatsApp fallito: ${waRes.error}`);
                } catch (waErr) {
                    console.error("WA Error:", waErr);
                }
            }
            
            setIsOpen(false);
            window.location.reload();
        } catch (error: any) {
            toast.error(`ERRORE CRITICO: ${error.message || 'Controlla la connessione'}`);
            console.error("Submit error:", error);
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
                    "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-sm border border-rose-100",
                    btnClass
                )}
                onClick={() => handleAction('cancelled')}
                title="Cancellato"
            >
                <XCircle className={showLabels ? "h-4 w-4" : "h-3.5 w-3.5"} />
                {showLabels && <span>Cancellato</span>}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] p-8 space-y-6 bg-white overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="sr-only">
                            {actionType === 'appointment' ? "Fissa Appuntamento" : "Registra Attività"}
                        </DialogTitle>
                    </DialogHeader>

                    {actionType === 'appointment' ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            {/* Title Input */}
                            <div className="relative group px-1">
                                <Input 
                                    placeholder="Aggiungi titolo"
                                    value={appointmentTitle}
                                    onChange={(e) => {
                                        setAppointmentTitle(e.target.value);
                                        setIsTitleManual(true);
                                    }}
                                    className="border-0 border-b-2 border-indigo-100 rounded-none bg-transparent h-14 text-2xl font-black text-indigo-900 placeholder:text-slate-200 focus-visible:ring-0 focus-visible:border-indigo-500 transition-all px-0"
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="flex flex-wrap gap-2.5">
                                <button
                                    onClick={() => setAppointmentType('showroom')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 h-14 px-3 rounded-[1.3rem] text-[9px] font-black uppercase tracking-tight transition-all",
                                        appointmentType === 'showroom' 
                                            ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" 
                                            : "bg-white text-slate-400 border border-slate-50 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <span className="text-base">🏠</span> APPUNTAMENTO SHOWROOM
                                </button>
                                <button
                                    onClick={() => setAppointmentType('call')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 h-14 px-3 rounded-[1.3rem] text-[9px] font-black uppercase tracking-tight transition-all",
                                        appointmentType === 'call' 
                                            ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" 
                                            : "bg-white text-slate-400 border border-slate-50 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <span className="text-base">📞</span> RICHIAMATA
                                </button>
                                <button
                                    onClick={() => setAppointmentType('video')}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 h-14 px-3 rounded-[1.3rem] text-[9px] font-black uppercase tracking-tight transition-all mt-0.5",
                                        appointmentType === 'video' 
                                            ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" 
                                            : "bg-white text-slate-400 border border-slate-50 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <span className="text-base">📹</span> VIDEOCHIAMATA
                                </button>
                            </div>

                            {/* Programming Section */}
                            <div className="bg-indigo-50/30 rounded-[2.5rem] p-7 space-y-6 border border-indigo-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-900">Programmazione</h3>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 bg-white rounded-[1.3rem] p-3.5 flex items-center shadow-sm border border-slate-100">
                                        <Input 
                                            type="date"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            className="border-none bg-transparent font-bold text-slate-900 focus-visible:ring-0 p-0 text-sm h-auto"
                                        />
                                    </div>
                                    <div className="w-[125px] bg-white rounded-[1.3rem] p-3.5 flex items-center justify-between shadow-sm border border-slate-100">
                                        <Input 
                                            type="time"
                                            value={appointmentHour}
                                            onChange={(e) => setAppointmentHour(e.target.value)}
                                            className="border-none bg-transparent font-bold text-slate-900 focus-visible:ring-0 p-0 text-sm h-auto flex-1"
                                        />
                                        <Clock className="h-3.5 w-3.5 text-slate-300 ml-1.5" />
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Notification */}
                            <div className="flex items-center gap-4 p-5 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50">
                                <Checkbox 
                                    id="whatsapp" 
                                    checked={sendWhatsapp} 
                                    onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                    className="h-7 w-7 rounded-full border-emerald-200 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none shadow-sm shadow-emerald-100"
                                />
                                <div className="flex-1 cursor-pointer" onClick={() => setSendWhatsapp(!sendWhatsapp)}>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                                        <Label className="text-[10px] font-black text-emerald-900 uppercase tracking-tight leading-none">
                                            Invia notifica WhatsApp al cliente
                                        </Label>
                                    </div>
                                    <p className="text-[8px] font-bold text-emerald-600/50 uppercase mt-1 tracking-tighter">Verrà usato il template ufficiale di Meta</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsOpen(false)} 
                                    className="rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all text-[10px]"
                                >
                                    Annulla
                                </Button>
                                <Button 
                                    onClick={submitAction} 
                                    disabled={loading || !appointmentDate}
                                    className="bg-[#B4B1FF] hover:bg-indigo-400 text-white rounded-[1.3rem] h-14 px-10 font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 text-[10px]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva Appuntamento"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">
                                    {actionType === 'contacted' && "📞 Registra Contatto"}
                                    {actionType === 'no-answer' && "🔇 Non Risponde"}
                                    {actionType === 'preventivo' && "📑 Passa a Preventivo"}
                                    {actionType === 'cancelled' && "❌ Cancella Lead"}
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 italic">
                                        {lead.firstName} {lead.lastName}
                                   </span>
                                </div>
                            </DialogHeader>
                            
                            <div className="space-y-4">
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

                                {actionType === 'no-answer' && (
                                    <div className="bg-amber-50/30 rounded-[2.5rem] p-7 space-y-4 border border-amber-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-900">Promemoria Interno (Richiamo)</h3>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 bg-white rounded-[1.3rem] p-3.5 flex items-center shadow-sm border border-slate-100">
                                                <Input 
                                                    type="date"
                                                    value={reminderDate}
                                                    onChange={(e) => setReminderDate(e.target.value)}
                                                    className="border-none bg-transparent font-bold text-slate-900 focus-visible:ring-0 p-0 text-sm h-auto"
                                                />
                                            </div>
                                            <div className="w-[125px] bg-white rounded-[1.3rem] p-3.5 flex items-center justify-between shadow-sm border border-slate-100">
                                                <Input 
                                                    type="time"
                                                    value={reminderHour}
                                                    onChange={(e) => setReminderHour(e.target.value)}
                                                    className="border-none bg-transparent font-bold text-slate-900 focus-visible:ring-0 p-0 text-sm h-auto flex-1"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[8px] font-bold text-amber-600/50 uppercase italic px-1">Questa è una notifica interna, non verrà mandata al cliente.</p>
                                    </div>
                                )}

                                {actionType !== 'cancelled' && (
                                    <div className="flex items-center space-x-4 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                                        <Checkbox 
                                            id="whatsapp-alt" 
                                            checked={sendWhatsapp} 
                                            onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                            className="h-6 w-6 rounded-xl border-emerald-200 data-[state=checked]:bg-emerald-500"
                                        />
                                        <Label htmlFor="whatsapp-alt" className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight">
                                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                                            Invia Template WhatsApp al cliente
                                        </Label>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex gap-3">
                                <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Annulla</Button>
                                <Button 
                                    onClick={submitAction} 
                                    disabled={loading}
                                    className={cn(
                                        "flex-[2] rounded-full h-14 px-8 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95",
                                        actionType === 'cancelled' ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700",
                                        "text-white"
                                    )}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Stato"}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
// trigger fresh build
