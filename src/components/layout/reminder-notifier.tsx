'use client'

import { useEffect, useState, useRef } from "react"
import { getDueRemindersAction } from "@/actions/reminder-actions"
import { toast } from "sonner"
import { Bell, Phone, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function ReminderNotifier() {
    const activeToasts = useRef<Map<string, string | number>>(new Map());
    const lastNotifiedAt = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        const checkReminders = async () => {
            const res = await getDueRemindersAction();
            
            if (res.success) {
                const dueIds = new Set(res.reminders.map(r => r.id));

                // 1. AUTO-ELIMINAZIONE: Se un lead non è più tra quelli dovuti, rimuoviamo il toast
                activeToasts.current.forEach((toastId, leadId) => {
                    if (!dueIds.has(leadId)) {
                        toast.dismiss(toastId);
                        activeToasts.current.delete(leadId);
                    }
                });

                // 2. NOTIFICA DINAMICA: Mostriamo o aggiorniamo i toast per i lead dovuti
                res.reminders.forEach((rem) => {
                    const followupAtStr = rem.nextFollowupAt?.toString() || "";
                    const lastTime = lastNotifiedAt.current.get(rem.id);

                    // Se non lo abbiamo ancora notificato PER QUESTO ORARIO specifico
                    if (lastTime !== followupAtStr) {
                        // Se c'era un vecchio toast per questo lead (ora diverso), lo chiudiamo prima
                        if (activeToasts.current.has(rem.id)) {
                            toast.dismiss(activeToasts.current.get(rem.id));
                        }

                        const hour = rem.nextFollowupAt 
                            ? new Date(rem.nextFollowupAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                            : "Ora";

                        const newToastId = toast.custom((t) => (
                            <div className="bg-white border-2 border-indigo-500 rounded-3xl p-5 shadow-2xl flex items-start gap-4 ring-4 ring-indigo-50/50 animate-in slide-in-from-right-full">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Bell className="h-6 w-6 animate-bounce" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sveglia Ricontatto!</h4>
                                    <p className="text-xs text-slate-500 font-bold mt-1">
                                        Ore {hour}: <span className="text-indigo-600 uppercase">{rem.firstName} {rem.lastName}</span> attende la tua chiamata.
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <Link 
                                            href={`/leads/${rem.id}`}
                                            onClick={() => toast.dismiss(t)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                                        >
                                            Vedi Lead <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        toast.dismiss(t);
                                        // Non cancelliamo l'ID dai notificati per evitare che riappaia subito, 
                                        // lo cancellerà l'auto-eliminazione se il lead non sarà più dovuto.
                                    }}
                                    className="text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ), { duration: 60000 }); // Dura 1 minuto o finché non rimosso

                        activeToasts.current.set(rem.id, newToastId);
                        lastNotifiedAt.current.set(rem.id, followupAtStr);
                    }
                });
            }
        };

        // Primo check immediato
        checkReminders();

        // Polling ogni 30 secondi
        const interval = setInterval(checkReminders, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return null; // Componente invisibile
}
