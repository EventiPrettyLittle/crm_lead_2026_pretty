'use client'

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Users, Workflow, Search, SortAsc, SortDesc, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DealsListProps {
    initialDeals: any[];
}

export function DealsList({ initialDeals }: DealsListProps) {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("date_asc"); // date_asc, date_desc, progress_asc, progress_desc

    // Logica di Filtro e Sort
    const filteredDeals = initialDeals
        .filter(deal => 
            `${deal.firstName} ${deal.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'date_asc') return new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime();
            if (sortBy === 'date_desc') return new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime();
            if (sortBy === 'progress_asc') return a.progress - b.progress;
            if (sortBy === 'progress_desc') return b.progress - a.progress;
            return 0;
        });

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
        <div className="space-y-8">
            {/* Toolbar: Filtri e Ricerca */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cerca cliente..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-bold"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-12 w-full md:w-[220px] rounded-2xl bg-slate-50 border-none font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-indigo-600" />
                                <SelectValue placeholder="Ordina per..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                            <SelectItem value="date_asc" className="font-bold">📅 Data Evento: Più vicini</SelectItem>
                            <SelectItem value="date_desc" className="font-bold">📅 Data Evento: Più lontani</SelectItem>
                            <SelectItem value="progress_desc" className="font-bold">📊 Andamento: Più completi</SelectItem>
                            <SelectItem value="progress_asc" className="font-bold">📊 Andamento: Da iniziare</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <Workflow className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">Nessun Deal trovato</p>
                    </div>
                ) : filteredDeals.map((deal: any) => (
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
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 text-slate-300" />
                                            <span className="text-[10px] font-bold text-slate-500">{deal.guestsCount || '--'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 font-bold text-[10px] uppercase group-hover:translate-x-1 transition-transform">
                                            Dettagli <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
