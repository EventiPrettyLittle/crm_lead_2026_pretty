'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Search, 
    Download, 
    Filter, 
    Calendar, 
    Wallet, 
    ArrowUpDown,
    CheckCircle2,
    FileSpreadsheet,
    FileText
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FinanceReportProps {
    payments: any[];
}

export function FinanceReport({ payments }: FinanceReportProps) {
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState<string>("ALL");
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const filteredPayments = useMemo(() => {
        return payments
            .filter(p => {
                const matchesSearch = p.leadName.toLowerCase().includes(search.toLowerCase());
                const matchesMethod = methodFilter === "ALL" || p.method?.toUpperCase() === methodFilter;
                return matchesSearch && matchesMethod;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortDir === 'desc' ? dateB - dateA : dateA - dateB;
            });
    }, [payments, search, methodFilter, sortDir]);

    const totalsByMethod = useMemo(() => {
        const totals: Record<string, number> = {
            CONTANTI: 0,
            BONIFICO: 0,
            POS: 0,
            ASSEGNO: 0,
            ALTRO: 0
        };

        filteredPayments.forEach(p => {
            const m = p.method?.toUpperCase() || 'ALTRO';
            const methodKey = ['CARTA', 'POS', 'LINK'].includes(m) ? 'POS' : 
                             ['CONTANTI', 'CASH'].includes(m) ? 'CONTANTI' :
                             ['BONIFICO', 'TRANSFER'].includes(m) ? 'BONIFICO' :
                             m === 'ASSEGNO' ? 'ASSEGNO' : 'ALTRO';
            
            if (totals[methodKey] !== undefined) {
                totals[methodKey] += Number(p.amount || 0);
            } else {
                totals['ALTRO'] += Number(p.amount || 0);
            }
        });

        return totals;
    }, [filteredPayments]);

    const totalFiltered = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const exportToCSV = () => {
        const headers = ["Data", "Cliente", "Metodo", "Importo", "Note"];
        const rows = filteredPayments.map(p => [
            format(new Date(p.date), 'dd/MM/yyyy'),
            p.leadName,
            p.method || '-',
            Number(p.amount).toFixed(2),
            p.notes || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Report_Incassi_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Summary Totals Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Totale Filtrato</span>
                    <span className="text-2xl font-black text-white italic">€{totalFiltered.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
                {Object.entries(totalsByMethod).map(([method, amount]) => (
                    <div key={method} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter block mb-1">{method}</span>
                        <span className="text-xl font-black text-slate-900">€{amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col xl:flex-row justify-between gap-6 items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cerca per cliente o numero ordine..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700"
                        />
                    </div>
                    
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-xl h-12 items-center">
                        {["ALL", "CONTANTI", "BONIFICO", "POS"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMethodFilter(m)}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    methodFilter === m ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={exportToCSV}
                        className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        Scarica Report CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[150px] py-6 cursor-pointer group" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Data {sortDir === 'desc' ? <ArrowUpDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 rotate-180" />}
                                </div>
                            </TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metodo</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Importo</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Note</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPayments.map((p: any) => (
                            <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                <TableCell className="py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm">{format(new Date(p.date), 'dd/MM/yyyy')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-900 text-sm uppercase italic">{p.leadName}</span>
                                        <span className="text-[9px] font-bold text-slate-400">ORDINE #{p.quoteNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        "border-none font-black text-[9px] uppercase tracking-tighter px-3 py-1 rounded-full",
                                        p.method?.toUpperCase() === 'BONIFICO' && "bg-blue-100 text-blue-700",
                                        p.method?.toUpperCase() === 'CONTANTI' && "bg-emerald-100 text-emerald-700",
                                        ['CARTA', 'POS', 'LINK'].includes(p.method?.toUpperCase()) && "bg-purple-100 text-purple-700",
                                        !p.method && "bg-slate-100 text-slate-500"
                                    )}>
                                        {p.method || 'ALTRO'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-base font-black text-slate-900 italic">
                                        €{Number(p.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-slate-400 max-w-[200px] block truncate" title={p.notes}>
                                        {p.notes || '-'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredPayments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <Wallet className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest">Nessun incasso trovato</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
