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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'contacted' && "Log Contatto"}
                            {actionType === 'no-answer' && "⏰ Reminder di Ricontatto"}
                            {actionType === 'schedule' && "Programma Appuntamento"}
                            {actionType === 'cancelled' && "Cancella Lead / Perso"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Note</Label>
                            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Riassunto della conversazione..." />
                        </div>

                        {(actionType === 'no-answer' || actionType === 'schedule') && (
                            <div className="grid gap-2">
                                <Label className="text-indigo-600 font-bold">
                                    {actionType === 'no-answer' ? "⏰ Quando vuoi richiamarlo?" : "Data Prossimo Contatto / Appuntamento"}
                                </Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>Scegli data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input
                                        type="time"
                                        className="w-32"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {(actionType === 'contacted' || actionType === 'no-answer') && (
                            <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 transition-all hover:bg-indigo-50">
                                <Checkbox 
                                    id="whatsapp" 
                                    checked={sendWhatsapp} 
                                    onCheckedChange={(checked: boolean) => setSendWhatsapp(checked)}
                                    className="h-5 w-5 rounded-lg border-indigo-200 data-[state=checked]:bg-indigo-600"
                                />
                                <div className="grid gap-0.5 leading-none">
                                    <Label 
                                        htmlFor="whatsapp" 
                                        className="text-sm font-bold text-indigo-900 cursor-pointer flex items-center gap-2"
                                    >
                                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                                        Invia Template WhatsApp
                                    </Label>
                                    <p className="text-[10px] text-indigo-500 font-medium italic opacity-70">
                                        Il messaggio userà il template predefinito di Meta.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={submitAction} disabled={loading}>
                            {loading ? "Salvataggio..." : "Conferma"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
