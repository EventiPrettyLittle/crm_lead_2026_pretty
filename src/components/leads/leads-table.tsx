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
                                <TableHead className="w-[80px] px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">#</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Status</TableHead>
                                <TableHead className="min-w-[150px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Cliente</TableHead>
                                <TableHead className="min-w-[130px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Evento</TableHead>
                                <TableHead className="min-w-[100px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Ospiti</TableHead>
                                <TableHead
                                    className="min-w-[120px] cursor-pointer hover:bg-indigo-50/50 transition-colors text-[10px] font-black uppercase tracking-widest text-indigo-500 py-5 group"
                                    onClick={() => handleSort('eventDate')}
                                >
                                    <div className="flex items-center">
                                        Data <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                                    </div>
                                </TableHead>
                                <TableHead className="min-w-[150px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Location</TableHead>
                                <TableHead className="min-w-[150px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Contatto</TableHead>
                                <TableHead className="min-w-[150px] px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 text-right flex justify-end items-center h-full">Azioni Rapide</TableHead>
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
                                    <TableRow key={lead.id} className="group hover:bg-indigo-50/30 transition-all duration-300 border-b border-slate-50 last:border-0">
                                        <TableCell className="px-8 py-4">
                                            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-[1rem] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-300">
                                                <Link href={`/leads/${lead.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                lead.stage === 'NUOVO' ? 'default' :
                                                    lead.stage === 'PERSO' ? 'destructive' : 'secondary'
                                            } className={cn(
                                                "font-black text-[9px] px-2.5 py-1 rounded-lg tracking-widest uppercase shadow-sm border-none transition-all",
                                                lead.stage === 'NUOVO' && "bg-sky-500 text-white shadow-sky-500/20",
                                                lead.stage === 'CONTATTATO' && "bg-emerald-500 text-white shadow-emerald-500/20",
                                                lead.stage === 'NON_RISPONDE' && "bg-amber-400 text-slate-900 shadow-amber-400/20",
                                                lead.stage === 'DA_RICONTATTARE' && "bg-indigo-500 text-white shadow-indigo-500/20",
                                                lead.stage === 'APPUNTAMENTO' && "bg-violet-600 text-white shadow-violet-600/20",
                                                lead.stage === 'PERSO' && "bg-rose-500 text-white shadow-rose-500/20"
                                            )}>
                                                {lead.stage.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-extrabold text-slate-900 text-[13px] leading-none flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                                                    {lead.firstName} {lead.lastName}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold tracking-tight">{lead.phoneRaw || lead.email}</span>
                                                    {(lead as any).preferredContactTime && (
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[8px] font-black py-0.5 px-2 rounded-md flex items-center gap-1 uppercase tracking-widest">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {(lead as any).preferredContactTime}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.eventType ? (
                                                <Badge className={cn(
                                                    "font-black text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-100 transition-all",
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
                                            ) : (
                                                <span className="text-slate-400 font-extrabold text-[10px] italic">Nessun tipo</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {lead.guestsCount ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-black rounded-[0.8rem] w-fit">
                                                    <span>🍷</span> <span>{lead.guestsCount}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-extrabold text-[10px]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-extrabold text-indigo-600 text-xs">
                                            {lead.eventDate ? format(new Date(lead.eventDate), 'dd/MM/yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-extrabold text-slate-800 text-[11px] leading-tight flex items-center gap-1.5">
                                                    <span className="text-[10px]">📍</span> {(lead as any).locationName || (lead.eventLocation?.split(',')[0]) || '-'}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold truncate max-w-[150px] uppercase tracking-widest">
                                                    {lead.eventLocation || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.preferredContactTime ? (
                                                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-[0.8rem] border border-indigo-100 flex items-center gap-1.5 w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {lead.preferredContactTime}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-widest">Sempre</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex justify-end transition-opacity">
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
