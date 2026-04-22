'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Phone, 
    Calendar, 
    UserX,
    Send,
    Loader2,
    MessageCircle,
    XCircle,
    Clock,
    FileText,
    Sparkles,
    MessageSquare,
    Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLeadQuickAction } from '@/actions/lead-actions'
import { sendLeadWhatsAppAction } from "@/actions/whatsapp-actions"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Lead } from '@prisma/client'

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const router = useRouter()
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

    const handleAction = (type: any) => {
        setActionType(type);
        setIsOpen(true);
        setSendWhatsapp(true);
        setNotes("");
        setReminderDate("");
        setIsTitleManual(false);
    };

    const submitAction = async () => {
        if (!actionType) return;
        setLoading(true);

        try {
            if (actionType === 'preventivo') {
                await updateLeadQuickAction(lead.id, 'preventivo', { notes });
                window.location.href = `/quotes?createFor=${lead.id}`;
                return;
            }

            const combinedDateTime = actionType === 'appointment' && appointmentDate 
                ? `${appointmentDate}T${appointmentHour}` 
                : undefined;

            const finalNotes = actionType === 'appointment' 
                ? `[${appointmentType.toUpperCase()}] ${appointmentTitle ? appointmentTitle + ' - ' : ''}${notes}` 
                : notes;

            const reminderDateTime = (actionType === 'no-answer' && reminderDate)
                ? new Date(`${reminderDate}T${reminderHour}`)
                : undefined;

            await updateLeadQuickAction(lead.id, actionType as any, {
                notes: finalNotes,
                nextFollowup: reminderDateTime,
                appointmentDate: combinedDateTime,
                appointmentType: actionType === 'appointment' ? appointmentType : undefined,
                title: actionType === 'appointment' ? appointmentTitle : undefined
            });

            if (sendWhatsapp && (actionType === 'contacted' || actionType === 'no-answer' || actionType === 'appointment')) {
                try {
                    await sendLeadWhatsAppAction(lead.id, actionType, {
                        date: combinedDateTime,
                        type: actionType === 'appointment' ? appointmentType : undefined
                    });
                    toast.success("Messaggio WhatsApp inviato");
                } catch (waErr) {
                    toast.error("Nota salvata, errore WhatsApp");
                }
            }
            
            toast.success("Lead aggiornato correttamente");
            setIsOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Errore nel salvataggio");
        } finally {
            setLoading(false);
        }
    };

    const openDirectWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.phoneRaw) return;
        const phone = lead.phoneRaw.replace(/\D/g, '');
        const text = encodeURIComponent(`Ciao ${lead.firstName}, sono Luca di Pretty. Ti contatto in merito alla tua richiesta...`);
        window.open(`https://wa.me/${phone.startsWith('39') ? phone : '39' + phone}?text=${text}`, '_blank');
    }

    const actions = [
        { id: 'whatsapp', label: 'WHATSAPP', icon: MessageCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', onClick: openDirectWhatsApp },
        { id: 'contacted', label: 'CONTATTATO', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { id: 'no-answer', label: 'NON RISPONDE', icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { id: 'appointment', label: 'APPUNTAMENTO', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { id: 'preventivo', label: 'PREVENTIVO', icon: Send, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        { id: 'cancelled', label: 'CANCELLATO', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
    ]

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {actions.map((action) => (
                <Button
                    key={action.id}
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (action.id === 'whatsapp') action.onClick!(e);
                        else handleAction(action.id);
                    }}
                    disabled={loading}
                    className={cn(
                        "transition-all h-9 rounded-xl border font-black text-[9px] uppercase tracking-wider flex items-center gap-2 px-4 shadow-none",
                        action.bg, action.color, action.border,
                        "hover:opacity-80 active:scale-95"
                    )}
                >
                    <action.icon className="h-3.5 w-3.5" />
                    {showLabels && <span>{action.label}</span>}
                </Button>
            ))}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px] border-none shadow-2xl rounded-[3rem] p-0 bg-white overflow-hidden">
                    <div className="p-8 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black italic text-slate-900 uppercase tracking-tighter">
                                {actionType === 'appointment' ? "📅 Fissa Appuntamento" : null}
                                {actionType === 'contacted' && "📞 CONTATTATO"}
                                {actionType === 'no-answer' && "📣 NON RISPONDE"}
                                {actionType === 'preventivo' && "📑 PREVENTIVO"}
                                {actionType === 'cancelled' && "❌ CANCELLATO"}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 px-4 py-1.5 rounded-full border border-indigo-100 italic">
                                    {lead.firstName} {lead.lastName}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            {actionType === 'appointment' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-wrap gap-2">
                                        {['showroom', 'call', 'video'].map(type => (
                                            <button key={type} onClick={() => setAppointmentType(type as any)} className={cn(
                                                "flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all",
                                                appointmentType === type ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 border border-slate-100"
                                            )}>
                                                {type === 'showroom' ? '🏠' : type === 'call' ? '📞' : '📹'} {type}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <Label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Data</Label>
                                            <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="bg-transparent border-none p-0 h-auto font-black text-sm" />
                                        </div>
                                        <div className="w-32 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <Label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Ora</Label>
                                            <Input type="time" value={appointmentHour} onChange={(e) => setAppointmentHour(e.target.value)} className="bg-transparent border-none p-0 h-auto font-black text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic font-bold">Note Attività</Label>
                                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scrivi qui eventuali dettagli..." className="rounded-[1.5rem] border-slate-100 min-h-[110px] bg-slate-50/50 p-5 focus:ring-indigo-500/20" />
                            </div>

                            {actionType === 'no-answer' && (
                                <div className="bg-amber-50/40 rounded-[2.5rem] p-7 space-y-4 border border-amber-100/50 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                     <div className="flex items-center gap-3 mb-2">
                                         <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                                             <Clock className="h-4 w-4" />
                                         </div>
                                         <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-900 italic">Promemoria Interno (Richiamo)</h4>
                                     </div>
                                     <div className="flex gap-4">
                                         <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                                             <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="bg-transparent border-none p-0 h-auto font-black text-slate-700 text-sm focus-visible:ring-0" />
                                         </div>
                                         <div className="w-32 bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                                             <Input type="time" value={reminderHour} onChange={(e) => setReminderHour(e.target.value)} className="bg-transparent border-none p-0 h-auto font-black text-slate-700 text-sm focus-visible:ring-0" />
                                         </div>
                                     </div>
                                     <p className="text-[8px] font-bold text-rose-500 uppercase italic tracking-tighter px-1">Questa è una notifica interna, non verrà mandata al cliente.</p>
                                </div>
                            )}

                            {(actionType === 'contacted' || actionType === 'no-answer' || actionType === 'appointment') && (
                                <div className="flex items-center space-x-5 p-6 bg-emerald-50/40 rounded-[2.5rem] border border-emerald-100 group cursor-pointer hover:bg-emerald-50 transition-all" onClick={() => setSendWhatsapp(!sendWhatsapp)}>
                                    <Checkbox id="wa-final" checked={sendWhatsapp} onCheckedChange={(c: boolean) => setSendWhatsapp(c)} className="h-7 w-7 rounded-full border-emerald-200 data-[state=checked]:bg-emerald-500 shadow-lg shadow-emerald-100" />
                                    <div className="flex-1">
                                        <Label htmlFor="wa-final" className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight">
                                            <MessageSquare className="h-4 w-4 text-emerald-500" /> Invia Template WhatsApp al cliente
                                        </Label>
                                        <p className="text-[8px] font-bold text-emerald-600/40 uppercase mt-0.5 tracking-tighter">Messaggio predefinito basato sullo stato</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Annulla</Button>
                            <Button onClick={submitAction} disabled={loading} className={cn("flex-[2.5] rounded-[1.5rem] h-14 font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl text-white transition-all transform hover:scale-[1.02] active:scale-95", actionType === 'cancelled' ? "bg-rose-500" : "bg-indigo-600")}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Stato"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
