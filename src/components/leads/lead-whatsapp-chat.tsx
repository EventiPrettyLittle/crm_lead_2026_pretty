'use client'

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, Zap, Loader2 } from "lucide-react"
import { sendFreeWhatsAppMessageAction } from "@/actions/whatsapp-actions"
import { toast } from "sonner"

interface LeadWhatsAppChatProps {
    leadId: string
    leadName: string
    phone?: string | null
}

export function LeadWhatsAppChat({ leadId, leadName, phone }: LeadWhatsAppChatProps) {
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)

    const handleSend = async () => {
        if (!message.trim()) return;
        
        setIsSending(true);
        const res = await sendFreeWhatsAppMessageAction(leadId, message);
        
        if (res.success) {
            toast.success("Messaggio inviato con successo!");
            setMessage("");
        } else {
            toast.error(res.error || "Errore durante l'invio");
        }
        setIsSending(false);
    };

    if (!phone) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold italic text-lg">Nessun numero di telefono configurato per questo lead.</p>
            </div>
        )
    }

    return (
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-[500px]">
            {/* Chat Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 text-white">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-black italic text-xl leading-none">Chat con {leadName}</h3>
                        <p className="text-white/70 text-xs font-medium mt-1 uppercase tracking-widest">{phone}</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-tighter">
                    Official API
                </div>
            </div>

            {/* Message Area (Simulated empty history for now) */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-4">
                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-2 opacity-50">
                    <Zap className="h-8 w-8" />
                    <p className="text-sm font-bold italic">Inizia una nuova conversazione libera...</p>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="relative group transition-all duration-300">
                    <Textarea
                        placeholder="Scrivi qui il tuo messaggio..."
                        className="min-h-[100px] rounded-3xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50/50 p-4 text-base font-medium resize-none transition-all pr-16"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className={`absolute right-3 bottom-3 h-12 w-12 rounded-2xl shadow-xl transition-all duration-500 ${
                            message.trim() ? "bg-emerald-500 hover:bg-emerald-600 scale-100" : "bg-slate-200 scale-90 opacity-50 cursor-not-allowed"
                        }`}
                        onClick={handleSend}
                        disabled={isSending || !message.trim()}
                    >
                        {isSending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Send className="h-6 w-6 ml-0.5" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-3 px-2 italic uppercase tracking-wider">
                    Powered by SendApp.ai Gateway • Press Enter to Send
                </p>
            </div>
        </Card>
    )
}
