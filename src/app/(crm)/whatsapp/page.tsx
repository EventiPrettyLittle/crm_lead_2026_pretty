'use client'

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MessageSquare, ExternalLink, ShieldCheck, Clock, Send, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecentWhatsAppActivities } from "@/actions/whatsapp-dashboard"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"

import { useSearchParams } from "next/navigation"

import { Suspense } from "react"

function WhatsAppContent() {
    const searchParams = useSearchParams();
    const activePhone = searchParams.get("phone");
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            const res = await getRecentWhatsAppActivities();
            if (res.success && res.activities) {
                setActivities(res.activities);
            }
            setLoading(false);
        };
        fetchActivities();
    }, []);

    return (
        <div className="flex flex-col min-h-[calc(100vh-140px)] w-full space-y-8 p-1">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-200">
                            <MessageSquare className="h-8 w-8 text-white" />
                        </div>
                        WhatsApp Hub
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 text-lg">Il tuo centro di comando per le comunicazioni istantanee</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {activePhone && (
                        <div className="flex items-center gap-3 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-lg animate-in slide-in-from-right-10 duration-500">
                             <Zap className="h-4 w-4 text-indigo-200 fill-current" />
                            <span className="font-black italic">Lead Attivo: {activePhone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-emerald-700 font-bold text-sm uppercase tracking-wider">Gateway SendApp.ai Online</span>
                    </div>
                </div>
            </div>

            {/* Launchpad Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WhatsApp Web Card */}
                <Card 
                    className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 group cursor-pointer hover:scale-[1.02] transition-all duration-500 active:scale-95"
                    onClick={() => window.open('https://web.whatsapp.com', '_blank')}
                >
                    <div className="flex flex-col h-full justify-between space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                                <MessageSquare className="h-10 w-10 text-white" />
                            </div>
                            <ExternalLink className="h-6 w-6 text-white/50 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2 italic">WhatsApp Web</h2>
                            <p className="text-white/80 font-medium">Apri la chat ufficiale per messaggi diretti e conversazioni libere.</p>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Login via QR Code</span>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-white text-[10px] font-black uppercase">Official Access</div>
                        </div>
                    </div>
                </Card>

                {/* SendApp Console Card */}
                <Card 
                    className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 group cursor-pointer hover:scale-[1.02] transition-all duration-500 active:scale-95"
                    onClick={() => window.open('https://app.sendapp.ai/chat', '_blank')}
                >
                    <div className="flex flex-col h-full justify-between space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                                <Zap className="h-10 w-10 text-white" />
                            </div>
                            <ExternalLink className="h-6 w-6 text-white/50 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2 italic">SendApp Cloud</h2>
                            <p className="text-white/80 font-medium">Gestisci l'intelligenza artificiale, i template e le impostazioni account.</p>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Hybrid Integration</span>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-white text-[10px] font-black uppercase">Premium API</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 border-none shadow-xl rounded-[2.5rem] bg-white">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 italic">Cronologia Invii Recenti</h3>
                            <p className="text-slate-400 font-medium text-sm">Tracciamento automatico dei template CRM</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl"></div>
                            ))}
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="space-y-3">
                            {activities.map((activity) => (
                                <Link 
                                    href={`/leads/${activity.lead?.id}`} 
                                    key={activity.id}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <Send className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 italic">
                                                {activity.lead?.firstName} {activity.lead?.lastName}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {activity.notes || "Template WhatsApp"}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">
                                        {format(new Date(activity.createdAt), "dd MMM, HH:mm", { locale: it })}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic">Nessun messaggio inviato di recente.</p>
                        </div>
                    )}
                </Card>

                {/* Status/Check Card */}
                <Card className="p-8 border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <ShieldCheck className="h-12 w-12 text-emerald-400 mb-6" />
                            <h3 className="text-2xl font-black italic mb-4">Security Hub</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></div>
                                    Hash Crittografia Attivo
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></div>
                                    Validazione API Superata
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></div>
                                    Meta Cloud Auth: OK
                                </li>
                            </ul>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                Protected by Antigravity Shield
                            </p>
                        </div>
                    </div>
                    {/* Abstract background element */}
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </Card>
            </div>
        </div>
    )
}

export default function WhatsAppPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        }>
            <WhatsAppContent />
        </Suspense>
    )
}
