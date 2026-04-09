'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon, Phone, PhoneOff, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateLeadQuickAction } from "@/actions/lead-actions"
import { sendLeadWhatsAppAction } from "@/actions/whatsapp-actions"
import { createCalendarEvent } from "@/actions/calendar"
import { Lead } from "@prisma/client"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<'contacted' | 'no-answer' | 'schedule' | 'cancelled' | null>(null);
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
    const [time, setTime] = useState("10:00");
    const [loading, setLoading] = useState(false);
    const [sendWhatsapp, setSendWhatsapp] = useState(true);

    const handleAction = async (type: 'contacted' | 'no-answer' | 'schedule' | 'cancelled') => {
        setActionType(type);

        if (type === 'cancelled') {
            setIsOpen(true);
            return;
        }

        setIsOpen(true);

        if (type === 'no-answer') {
            setDate(addDays(new Date(), 1));
            setTime("10:00");
        } else if (type === 'schedule') {
            setDate(addDays(new Date(), 7)); // Default 1 week for appuntamento if not set
            setTime("10:00");
        } else if (type === 'contacted') {
            setDate(undefined);
        }

        setSendWhatsapp(type === 'contacted' || type === 'no-answer');
    };

    const submitAction = async () => {
        if (!actionType) return;
        setLoading(true);

        let nextFollowup: Date | undefined;
        if (date && (actionType === 'no-answer' || actionType === 'schedule')) {
            const [hours, minutes] = time.split(':').map(Number);
            nextFollowup = setHours(setMinutes(date, minutes), hours);
        }

        await updateLeadQuickAction(lead.id, actionType, {
            notes,
            nextFollowup,
        });

        // Invia WhatsApp per contattato, non risponde e appuntamento
        if (sendWhatsapp && (actionType === 'contacted' || actionType === 'no-answer' || actionType === 'schedule')) {
            const waRes = await sendLeadWhatsAppAction(lead.id, actionType);
            if (waRes.success) {
                toast.success("Messaggio WhatsApp inviato!");
            } else {
                toast.error(`WhatsApp fallito: ${waRes.error}`);
            }
        }

        // Per gli appuntamenti: salva anche su Google Calendar
        if (actionType === 'schedule' && nextFollowup) {
            const endTime = new Date(nextFollowup.getTime() + 60 * 60 * 1000); // +1 ora
            const calRes = await createCalendarEvent({
                title: `Appuntamento: ${lead.firstName} ${lead.lastName}`,
                description: notes || `Appuntamento con ${lead.firstName} ${lead.lastName}`,
                startDateTime: nextFollowup.toISOString(),
                endDateTime: endTime.toISOString(),
                location: (lead as any).eventLocation || '',
            });
            if (calRes.success) {
                toast.success("Appuntamento salvato su Google Calendar! 📅");
            } else {
                toast.warning(`Non salvato su Calendar: ${calRes.error}`);
            }
        }

        setLoading(true);
        setIsOpen(false);
        setNotes("");
        setLoading(false);
    };

    return (
        <div className="flex gap-2 flex-wrap">
            <Button
                variant="ghost"
                className={cn(
                    "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5",
                    showLabels ? "px-3 py-1.5 h-9 text-[10px] font-bold uppercase tracking-wider min-w-[100px] justify-center" : "h-8 w-8 p-0"
                )}
                onClick={() => handleAction('contacted')}
                title="Contattato"
            >
                <Phone className="h-4 w-4" />
                {showLabels && <span>Contattato</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5",
                    showLabels ? "px-3 py-1.5 h-9 text-[10px] font-bold uppercase tracking-wider min-w-[100px] justify-center" : "h-8 w-8 p-0"
                )}
                onClick={() => handleAction('no-answer')}
                title="Non Risponde"
            >
                <PhoneOff className="h-4 w-4" />
                {showLabels && <span>Non Risponde</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5",
                    showLabels ? "px-3 py-1.5 h-9 text-[10px] font-bold uppercase tracking-wider min-w-[100px] justify-center" : "h-8 w-8 p-0"
                )}
                onClick={() => handleAction('schedule')}
                title="Appuntamento"
            >
                <Clock className="h-4 w-4" />
                {showLabels && <span>Appuntamento</span>}
            </Button>

            <Button
                variant="ghost"
                className={cn(
                    "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5",
                    showLabels ? "px-3 py-1.5 h-9 text-[10px] font-bold uppercase tracking-wider min-w-[100px] justify-center" : "h-8 w-8 p-0"
                )}
                onClick={() => handleAction('cancelled')}
                title="Perso / Chiuso"
            >
                <Trash2 className="h-4 w-4" />
                {showLabels && <span>Perso / Chiuso</span>}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2.5rem] p-8 gap-0 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="hidden">
                            {actionType === 'schedule' ? "Programma Appuntamento" : "Azione Lead"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Google Calendar Style Title Input */}
                        {actionType === 'schedule' && (
                            <div className="space-y-6">
                                <div className="relative group">
                                    <Input 
                                        placeholder="Aggiungi titolo" 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="text-3xl font-bold border-none border-b-2 border-slate-100 focus-visible:ring-0 focus-visible:border-indigo-600 rounded-none px-0 py-2 h-auto placeholder:text-slate-200 transition-all bg-transparent"
                                    />
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100 group-focus-within:bg-indigo-600 scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                                </div>

                                {/* Caselle di spunta rapide (Presets) */}
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        className={cn(
                                            "rounded-2xl border-slate-100 text-[10px] font-black uppercase tracking-widest h-11 px-6 shadow-sm transition-all flex items-center gap-2",
                                            notes.includes("APPUNTAMENTO SHOWROOM") ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 shadow-xl" : "hover:border-indigo-600 hover:text-indigo-600 bg-white"
                                        )}
                                        onClick={() => setNotes(`APPUNTAMENTO SHOWROOM - ${lead.firstName?.toUpperCase()} ${lead.lastName?.toUpperCase()}`)}
                                    >
                                        🏠 Appuntamento Showroom
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        className={cn(
                                            "rounded-2xl border-slate-100 text-[10px] font-black uppercase tracking-widest h-11 px-6 shadow-sm transition-all flex items-center gap-2",
                                            notes.includes("RICHIAMATA") ? "bg-amber-500 border-amber-500 text-white shadow-amber-200 shadow-xl" : "hover:border-amber-500 hover:text-amber-500 bg-white"
                                        )}
                                        onClick={() => setNotes(`RICHIAMATA - ${lead.firstName?.toUpperCase()} ${lead.lastName?.toUpperCase()}`)}
                                    >
                                        📞 Richiamata
                                    </Button>
                                </div>
                            </div>
                        )}

                        {actionType !== 'schedule' && (
                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Note Attività</Label>
                                <Textarea 
                                    id="notes" 
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)} 
                                    placeholder={actionType === 'cancelled' ? "Perché il lead è stato perso?" : "Riassunto della conversazione..."}
                                    className="rounded-3xl border-slate-100 min-h-[120px] bg-slate-50/50 p-5 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-200"
                                />
                            </div>
                        )}

                        {(actionType === 'no-answer' || actionType === 'schedule') && (
                            <div className="grid gap-5 p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Programmazione</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 items-center">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "flex-1 min-w-[200px] justify-start text-left font-black text-xs h-12 rounded-[1.2rem] border-white shadow-sm hover:shadow-md transition-all",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                {date ? format(date, "EEEE, d MMMM", { locale: require('date-fns/locale').it }) : <span>Scegli data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                className="p-4"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <div className="flex items-center gap-2 bg-white p-1 rounded-[1.2rem] shadow-sm border border-slate-50">
                                        <Input
                                            type="time"
                                            className="w-28 border-none focus-visible:ring-0 text-center font-black h-10 text-lg"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(actionType === 'contacted' || actionType === 'no-answer' || actionType === 'schedule') && (
                            <div className="flex items-center space-x-4 p-5 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 group transition-all hover:bg-emerald-100/50">
                                <Checkbox 
                                    id="whatsapp" 
                                    checked={sendWhatsapp} 
                                    onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                    className="h-6 w-6 rounded-xl border-emerald-200 data-[state=checked]:bg-emerald-500 shadow-sm"
                                />
                                <div className="grid gap-1 leading-none">
                                    <Label 
                                        htmlFor="whatsapp" 
                                        className="text-[11px] font-black text-emerald-900 cursor-pointer flex items-center gap-2 uppercase tracking-tight"
                                    >
                                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                                        Invia Notifica WhatsApp al Cliente
                                    </Label>
                                    <p className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-tighter">Verrà usato il template ufficiale di Meta</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50">Annulla</Button>
                        <Button 
                            onClick={submitAction} 
                            disabled={loading || (actionType === 'schedule' && !notes)}
                            className="flex-[2] rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                        >
                            {loading ? "Salvataggio..." : "Salva Appuntamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
