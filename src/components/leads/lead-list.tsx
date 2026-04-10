'use client'

import { Lead } from "@prisma/client"
import { format, isPast, isToday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Calendar, Phone, Mail, MessageCircle, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { deleteQuote } from "@/actions/quotes"
import { toast } from "sonner"
import { useState } from "react"

interface LeadListProps {
    title: string;
    leads: Lead[];
    emptyMessage?: string;
    badgeColor?: string;
}

export function LeadList({ title, leads, emptyMessage = "Nessun cliente trovato.", badgeColor = "bg-primary" }: LeadListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleWhatsApp = (lead: any) => {
        const phone = lead.phoneNormalized || lead.phoneRaw?.replace(/\D/g, '');
        if (!phone) return;
        const text = encodeURIComponent(`Ciao ${lead.firstName}, come stai?`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    const handleDeleteQuote = async (quoteId: string, leadId: string) => {
        if (!confirm("Sei sicuro di voler eliminare definitivamente questo preventivo?")) return;
        setDeletingId(quoteId);
        try {
            await deleteQuote(quoteId, leadId);
            toast.success("Preventivo eliminato");
        } catch (e) {
            toast.error("Errore eliminazione");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="h-full border-none shadow-xl shadow-slate-200/50 bg-white/70 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-slate-400">
                    {title}
                    <Badge variant="secondary" className="rounded-full px-3 bg-slate-100 text-slate-600 border-none font-bold">
                        {leads.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px] custom-scrollbar">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6">
                         <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-slate-200" />
                         </div>
                         <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter text-center">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {leads.map((lead: any) => {
                            const isExpired = lead.nextFollowupAt && isPast(new Date(lead.nextFollowupAt)) && !isToday(new Date(lead.nextFollowupAt));
                            const currentQuote = lead.quotes?.[0];
                            
                            // 7-Day Timeline Logic (Expanded to all categories)
                            const startDate = (
                                lead.lastStatus === 'NON_RISPONDE' ? lead.lastStatusAt :
                                lead.stage === 'CONTATTATO' ? lead.contactedAt :
                                lead.stage === 'PREVENTIVO' ? (lead.quoteSentAt || lead.lastStatusAt) :
                                lead.lastStatusAt || lead.updatedAt
                            ) || lead.createdAt;

                            const lastStatusDate = startDate ? new Date(startDate) : null;
                            const updatedAtDate = lead.updatedAt ? new Date(lead.updatedAt) : null;
                            
                            // An action happened if updated after status set
                            const actionTaken = updatedAtDate && lastStatusDate && updatedAtDate.getTime() > (lastStatusDate.getTime() + 1000);
                            
                            const daysElapsed = lastStatusDate ? Math.floor((new Date().getTime() - lastStatusDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            const timelinePercent = Math.min((daysElapsed / 7) * 100, 100);
                            const isOverdue = daysElapsed >= 7 && !actionTaken;

                            return (
                                <div key={lead.id} className={cn(
                                    "group flex flex-col p-5 transition-all gap-3 border-l-4",
                                    isOverdue ? "bg-rose-50/50 border-l-rose-500 hover:bg-rose-100/50" : "hover:bg-slate-50/50 border-l-transparent"
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <Link href={`/leads/${lead.id}`} className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2 text-base">
                                                    {lead.firstName} {lead.lastName}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                
                                                <div className="flex-1 max-w-[120px] px-2 flex flex-col gap-1">
                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                                                        <span>Status {daysElapsed}gg</span>
                                                        <span className={cn(actionTaken ? "text-green-500" : isOverdue ? "text-rose-600 font-black" : "text-orange-500")}>
                                                            {actionTaken ? "Gestito" : isOverdue ? "SCADUTO" : `${daysElapsed}gg`}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={cn(
                                                                "h-full transition-all duration-1000",
                                                                actionTaken ? "bg-green-500 w-full" : 
                                                                isOverdue ? "bg-rose-600" :
                                                                daysElapsed >= 4 ? "bg-orange-500" : "bg-indigo-500"
                                                            )}
                                                            style={{ width: actionTaken ? '100%' : `${timelinePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {currentQuote && (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-indigo-600 text-white border-none rounded-lg px-2 shadow-sm">
                                                        #{currentQuote.number}
                                                    </Badge>
                                                )}
                                                {lead.productInterest && (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-500 border-indigo-100 rounded-lg px-2">
                                                        {lead.productInterest}
                                                    </Badge>
                                                )}
                                                {lead.stage && (
                                                    <Badge className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 border-none rounded-lg px-2">
                                                        {lead.stage}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {lead.nextFollowupAt && (
                                            <div className={cn(
                                                "text-[10px] font-black uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 shrink-0",
                                                isExpired ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                            )}>
                                                <Calendar className="h-3 w-3" />
                                                {isToday(new Date(lead.nextFollowupAt)) ? "Oggi" : format(new Date(lead.nextFollowupAt), 'dd MMM')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1">
                                            {currentQuote && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    disabled={!!deletingId}
                                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent"
                                                    onClick={() => handleDeleteQuote(currentQuote.id, lead.id)}
                                                >
                                                    {deletingId === currentQuote.id ? <Loader2 className="h-4 w-4 animate-spin text-rose-600" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            {lead.phoneRaw && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                                                    onClick={() => window.open(`tel:${lead.phoneRaw}`, '_self')}
                                                >
                                                    <Phone className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {lead.phoneRaw && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all border border-transparent hover:border-green-100"
                                                    onClick={() => handleWhatsApp(lead)}
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {lead.email && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                    onClick={() => window.open(`mailto:${lead.email}`, '_self')}
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <Button size="sm" variant="outline" asChild className="h-9 rounded-xl border-slate-100 font-black text-[10px] uppercase px-4 hover:bg-slate-900 hover:text-white transition-all">
                                            <Link href={`/leads/${lead.id}`}>
                                                Dettagli <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Search(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
