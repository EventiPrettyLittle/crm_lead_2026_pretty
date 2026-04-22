import { getDeals } from "@/actions/deals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Users, Workflow } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DealsPage() {
    const deals = await getDeals();

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Produzione & Logistica</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">
                        Gestione <span className="text-indigo-600">Deal</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg">Monitora l'andamento delle schede tecniche e la preparazione degli eventi.</p>
                </div>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <Workflow className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Nessun Deal attivo al momento</p>
                        <p className="text-slate-300 text-sm mt-2">I lead appariranno qui una volta che avranno un preventivo accettato.</p>
                    </div>
                ) : deals.map((deal: any) => {
                    // Calcolo colore della barra (0-100 Rosso -> Verde)
                    const getProgressColor = (percent: number) => {
                        if (percent < 30) return "bg-rose-500";
                        if (percent < 70) return "bg-amber-500";
                        return "bg-emerald-500";
                    };

                    const getTextColor = (percent: number) => {
                        if (percent < 30) return "text-rose-600";
                        if (percent < 70) return "text-amber-600";
                        return "text-emerald-600";
                    };

                    return (
                        <Card key={deal.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden group">
                            <CardContent className="p-0">
                                <Link href={`/deals/${deal.id}`}>
                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                                    {deal.firstName} {deal.lastName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {deal.eventDate ? new Date(deal.eventDate).toLocaleDateString('it-IT') : 'Data non impostata'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-tighter">
                                                VINTO
                                            </Badge>
                                        </div>

                                        {/* Progress Bar Section */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Andamento Scheda</p>
                                                <p className={cn("text-xs font-black italic", getTextColor(deal.progress))}>
                                                    {deal.progress}%
                                                </p>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full transition-all duration-1000", getProgressColor(deal.progress))}
                                                    style={{ width: `${deal.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-slate-300" />
                                                    <span className="text-[10px] font-bold text-slate-500">{deal.guestsCount || '--'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-indigo-600 font-bold text-[10px] uppercase group-hover:translate-x-1 transition-transform">
                                                Dettagli <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
