'use client'

import { useState } from "react"
import { Lead } from "@prisma/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { QuickActions } from "./quick-actions"
import Link from "next/link"
import { Eye, FilterX, ArrowUpDown, ArrowUp, ArrowDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LeadsTableProps {
    leads: Lead[];
}

type SortConfig = {
    key: 'leadCreatedAt' | 'eventDate';
    direction: 'asc' | 'desc';
} | null;

const STAGES = [
    'NUOVO',
    'CONTATTATO',
    'NON_RISPONDE',
    'DA_RICONTATTARE',
    'APPUNTAMENTO',
    'PREVENTIVO',
    'PERSO'
]

const YEARS = ['2026', '2027', '2028', '2029']

export function LeadsTable({ leads }: LeadsTableProps) {
    const [filterStage, setFilterStage] = useState<string | null>(null);
    const [filterEventType, setFilterEventType] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'leadCreatedAt', direction: 'desc' });

    const EVENT_TYPES = [
        "Matrimonio",
        "Comunione",
        "Battesimo",
        "Laurea",
        "Compleanno",
        "Evento Aziendale",
        "Altro"
    ]

    const handleSort = (key: 'leadCreatedAt' | 'eventDate') => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const getSortIcon = (key: 'leadCreatedAt' | 'eventDate') => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const filteredLeads = [...leads]
        .filter(lead => {
            if (filterStage && lead.stage !== filterStage) return false;
            if (filterYear) {
                if (!lead.eventDate) return false;
                const year = new Date(lead.eventDate).getFullYear().toString();
                if (year !== filterYear) return false;
            }
            if (filterEventType) {
                if (filterEventType === 'Altro') {
                    // Se filtriamo per Altro, mostriamo solo quelli che NON sono nei tipi definiti (esclusi gli null/empty)
                    return lead.eventType && !EVENT_TYPES.slice(0, -1).includes(lead.eventType);
                }
                return lead.eventType === filterEventType;
            }
            return true;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            const valA = a[key] ? new Date(a[key] as Date).getTime() : 0;
            const valB = b[key] ? new Date(b[key] as Date).getTime() : 0;

            if (direction === 'asc') return valA - valB;
            return valB - valA;
        });

    return (
        <div className="space-y-6">
            {/* Filtri */}
            <div className="flex flex-col gap-5 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-indigo-100/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Stato Lead:
                    </span>
                    {STAGES.map((stage) => (
                        <Button
                            key={stage}
                            variant={filterStage === stage ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-8 px-4 text-[10px] font-black uppercase rounded-full transition-all border-slate-200",
                                filterStage === stage ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20 hover:scale-105" : "hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-600"
                            )}
                            onClick={() => setFilterStage(filterStage === stage ? null : stage)}
                        >
                            {stage.replace('_', ' ').toLowerCase()}
                        </Button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Tipo Evento:
                    </span>
                    {EVENT_TYPES.map((type) => (
                        <Button
                            key={type}
                            variant={filterEventType === type ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-8 px-4 text-[10px] font-black uppercase rounded-full transition-all border-slate-200",
                                filterEventType === type ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105" : "hover:border-indigo-300 bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100"
                            )}
                            onClick={() => setFilterEventType(filterEventType === type ? null : type)}
                        >
                            {type}
                        </Button>
                    ))}

                    <div className="h-4 w-px bg-slate-100 mx-2 hidden sm:block" />

                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mr-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Anno:
                    </span>
                    {YEARS.map((year) => (
                        <Button
                            key={year}
                            variant={filterYear === year ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "h-8 px-4 text-[10px] font-black uppercase rounded-full transition-all border-slate-200",
                                filterYear === year ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30 hover:scale-105" : "hover:border-rose-300 bg-white hover:bg-slate-50 text-rose-500 border-rose-100"
                            )}
                            onClick={() => setFilterYear(filterYear === year ? null : year)}
                        >
                            {year}
                        </Button>
                    ))}

                    {(filterStage || filterEventType || filterYear) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-4 text-[10px] font-black text-rose-500 hover:text-rose-700 hover:bg-rose-50 uppercase tracking-tighter rounded-full ml-auto"
                            onClick={() => {
                                setFilterStage(null);
                                setFilterEventType(null);
                                setFilterYear(null);
                            }}
                        >
                            <FilterX className="h-3.5 w-3.5 mr-1.5" />
                            Resetta
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-2xl shadow-indigo-100/20">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 relative">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px] px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">#</TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Status</TableHead>
                                <TableHead className="w-[120px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Cliente</TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Evento</TableHead>
                                <TableHead className="w-[80px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Ospiti</TableHead>
                                <TableHead
                                    className="w-[100px] cursor-pointer hover:bg-indigo-50/50 transition-colors text-[9px] font-black uppercase tracking-widest text-indigo-500 py-4 group"
                                    onClick={() => handleSort('eventDate')}
                                >
                                    <div className="flex items-center">
                                        Data <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Location</TableHead>
                                <TableHead className="w-[100px] text-[9px] font-black uppercase tracking-widest text-slate-400 py-4">Contatto</TableHead>
                                <TableHead className="w-[160px] px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 py-4 text-right">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center bg-slate-50/30">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <FilterX className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <span className="text-slate-400 font-extrabold uppercase text-[11px] tracking-widest">
                                                Nessun lead corrisponde ai filtri
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50 last:border-0 h-12">
                                        <TableCell className="px-4 py-2.5">
                                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300">
                                                <Link href={`/leads/${lead.id}`}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Badge variant={
                                                lead.stage === 'NUOVO' ? 'default' :
                                                    (lead.stage === 'PERSO' || lead.stage === 'CANCELLATO') ? 'destructive' : 'secondary'
                                            } className={cn(
                                                "font-black text-[8px] px-2 py-0.5 rounded-md tracking-widest uppercase border-none transition-all",
                                                lead.stage === 'NUOVO' && "bg-sky-500 text-white shadow-sky-500/10",
                                                lead.stage === 'CONTATTATO' && "bg-emerald-500 text-white shadow-emerald-500/10",
                                                lead.stage === 'NON_RISPONDE' && "bg-amber-400 text-slate-900 shadow-amber-400/10",
                                                lead.stage === 'DA_RICONTATTARE' && "bg-indigo-400 text-white shadow-indigo-400/10",
                                                lead.stage === 'APPUNTAMENTO' && "bg-indigo-600 text-white shadow-indigo-600/10",
                                                lead.stage === 'PREVENTIVO' && "bg-violet-600 text-white shadow-violet-600/10",
                                                (lead.stage === 'PERSO' || lead.stage === 'CANCELLATO') && "bg-rose-500 text-white shadow-rose-500/10"
                                            )}>
                                                {lead.stage.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-slate-900 text-[11px] leading-none flex items-center gap-2 group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">
                                                    {lead.firstName} {lead.lastName}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold tracking-tight mt-0.5">{lead.phoneRaw}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            {lead.eventType ? (
                                                <Badge className={cn(
                                                    "font-black text-[8px] px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-50 transition-all",
                                                    lead.eventType === 'Matrimonio' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
                                                    lead.eventType === 'Battesimo' ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' :
                                                    lead.eventType === 'Comunione' ? 'bg-violet-50 text-violet-700 hover:bg-violet-100' :
                                                    lead.eventType === 'Laurea' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
                                                    lead.eventType === 'Compleanno' ? 'bg-pink-50 text-pink-700 hover:bg-pink-100' :
                                                    lead.eventType === 'Evento Aziendale' ? 'bg-slate-800 text-slate-100 hover:bg-slate-900' :
                                                    'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                )}>
                                                    {lead.eventType}
                                                </Badge>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            {lead.guestsCount ? (
                                                <div className="flex items-center gap-1 text-slate-600 text-[9px] font-black">
                                                    <span>🍷</span> <span>{lead.guestsCount}</span>
                                                </div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="font-extrabold text-indigo-600 text-[10px] py-2.5">
                                            {lead.eventDate ? format(new Date(lead.eventDate), 'dd/MM/yy') : '-'}
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-slate-800 text-[10px] leading-tight truncate max-w-[120px]">
                                                    📍 {(lead as any).locationName || (lead.eventLocation?.split(',')[0]) || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            {lead.preferredContactTime ? (
                                                <span className="text-[9px] font-black text-slate-500 uppercase leading-tight block max-w-[120px]">
                                                    {lead.preferredContactTime}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-black text-[9px] uppercase italic">Sempre</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-2.5 text-right">
                                            <div className="flex justify-end items-center">
                                                <QuickActions lead={lead as any} />
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
