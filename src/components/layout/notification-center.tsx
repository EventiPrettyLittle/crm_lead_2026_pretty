'use client'

import { useEffect, useState } from "react"
import { getDueRemindersAction } from "@/actions/reminder-actions"
import { Bell, User, Clock, ArrowRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
    const [reminders, setReminders] = useState<any[]>([])
    const [count, setCount] = useState(0)

    const fetchReminders = async () => {
        const res = await getDueRemindersAction()
        if (res.success) {
            setReminders(res.reminders)
            setCount(res.reminders.length)
        }
    }

    useEffect(() => {
        fetchReminders()
        const interval = setInterval(fetchReminders, 60000) // Aggiorna ogni minuto
        return () => clearInterval(interval)
    }, [])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="relative cursor-pointer group">
                    <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                        <Bell className={cn("h-5 w-5", count > 0 && "animate-pulse")} />
                    </div>
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-white text-[10px] font-black text-white flex items-center justify-center shadow-sm">
                            {count}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-3xl overflow-hidden border-slate-200 shadow-2xl" align="end">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Bell className="h-3 w-3 text-indigo-600" />
                        Notifiche Ricontatto
                    </h3>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {reminders.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nessun ricontatto dovuto</p>
                        </div>
                    ) : (
                        reminders.map((rem) => (
                            <Link 
                                key={rem.id} 
                                href={`/leads/${rem.id}`}
                                className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
                            >
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-[10px] font-black">
                                    {rem.firstName?.[0]}{rem.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 uppercase truncate">
                                        {rem.firstName} {rem.lastName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        Scaduto: {new Date(rem.nextFollowupAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
                                    </p>
                                </div>
                                <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-600 transition-colors self-center" />
                            </Link>
                        ))
                    )}
                </div>
                {reminders.length > 0 && (
                    <div className="p-3 bg-white border-t border-slate-100 text-center">
                        <Link href="/leads" className="text-[9px] font-black text-indigo-600 uppercase tracking-wider hover:underline">
                            Vedi tutti i lead
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
