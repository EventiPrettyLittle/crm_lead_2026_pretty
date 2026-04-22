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
    MessageSquare
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
    DialogFooter,
    DialogDescription
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
                <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] p-8 space-y-6 bg-white overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black italic text-slate-900 uppercase tracking-tight">
                            {actionType === 'appointment' ? "📅 Fissa Appuntamento" : null}
                            {actionType === 'contacted' && "📞 Registra Contatto"}
                            {actionType === 'no-answer' && "🔕 Non Risponde"}
                            {actionType === 'preventivo' && "📑 Passa a Preventivo"}
                            {actionType === 'cancelled' && "❌ Cancella Lead"}
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 italic">
                                {lead.firstName} {lead.lastName}
                             </span>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5">
                        {actionType === 'appointment' && (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex flex-wrap gap-2">
                                    {['showroom', 'call', 'video'].map(type => (
                                        <button key={type} onClick={() => setAppointmentType(type as any)} className={cn(
                                            "flex-1 flex items-center justify-center gap-2 h-12 px-3 rounded-2xl text-[9px] font-black uppercase transition-all",
                                            appointmentType === type ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 border border-slate-100"
                                        )}>
                                            {type === 'showroom' ? '🏠' : type === 'call' ? '📞' : '📹'} {type}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="bg-slate-50/50 rounded-xl h-12 font-bold" />
                                    <Input type="time" value={appointmentHour} onChange={(e) => setAppointmentHour(e.target.value)} className="bg-slate-50/50 rounded-xl h-12 font-bold w-32" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Note Attività</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scrivi qui eventuali dettagli..." className="rounded-3xl border-slate-100 min-h-[100px] bg-slate-50/50 p-5" />
                        </div>

                        {actionType === 'no-answer' && (
                            <div className="bg-amber-50/30 rounded-[2rem] p-6 space-y-4 border border-amber-100/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Promemoria Interno (Richiamo)
                                </h4>
                                <div className="flex gap-2">
                                    <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="bg-white rounded-xl h-10 text-xs font-bold" />
                                    <Input type="time" value={reminderHour} onChange={(e) => setReminderHour(e.target.value)} className="bg-white rounded-xl h-10 text-xs font-bold w-24" />
                                </div>
                                <p className="text-[8px] font-bold text-amber-600/50 uppercase italic tracking-tighter">Questa è una notifica interna, non verrà mandata al cliente.</p>
                            </div>
                        )}

                        {actionType !== 'cancelled' && (
                            <div className="flex items-center space-x-4 p-5 bg-emerald-50/30 rounded-[2rem] border border-emerald-100">
                                <Checkbox id="wa-check" checked={sendWhatsapp} onCheckedChange={(c: boolean) => setSendWhatsapp(c)} className="h-6 w-6 rounded-xl border-emerald-200 data-[state=checked]:bg-emerald-500" />
                                <Label htmlFor="wa-check" className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" /> Invia Template WhatsApp al cliente
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400">Annulla</Button>
                        <Button onClick={submitAction} disabled={loading} className={cn("flex-[2] rounded-full h-14 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl text-white transition-all active:scale-95", actionType === 'cancelled' ? "bg-rose-600" : "bg-indigo-600")}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Stato"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
