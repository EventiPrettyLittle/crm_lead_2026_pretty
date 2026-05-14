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
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between gap-6 items-start">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cerca per cliente..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-12 rounded-2xl bg-white border-slate-100 shadow-sm font-bold"
                        />
                    </div>
                    
                    <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm h-12 items-center overflow-x-auto max-w-full">
                        {["ALL", "CONTANTI", "BONIFICO", "POS"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMethodFilter(m)}
                                className={cn(
                                    "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    methodFilter === m ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Totals Summary in Header */}
                <div className="flex flex-wrap gap-4 justify-end w-full xl:w-auto">
                    <div className="flex flex-col items-end pr-4 border-r border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Filtrato</span>
                        <span className="text-2xl font-black text-slate-900 italic">€{totalFiltered.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(totalsByMethod).filter(([_, val]) => val > 0).map(([method, amount]) => (
                            <div key={method} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm min-w-[120px]">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter block">{method}</span>
                                <span className="text-sm font-black text-slate-900">€{amount.toLocaleString('it-IT')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={exportToCSV}
                            className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-100"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Esporta CSV
                        </Button>
                    </div>
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
