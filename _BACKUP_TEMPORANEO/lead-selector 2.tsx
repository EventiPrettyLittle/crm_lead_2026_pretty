'use client'

import { useState, useEffect } from 'react'
import { getLeadsMini } from '@/actions/quotes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserCheck } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LeadSelectorProps {
    currentLeadName: string;
    currentLeadEmail: string;
    onSelect: (leadId: string) => void;
}

export function LeadSelector({ currentLeadName, currentLeadEmail, onSelect }: LeadSelectorProps) {
    const [leadQuery, setLeadQuery] = useState("");
    const [leads, setLeads] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    // Debounced search for leads
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(async () => {
            const res = await getLeadsMini(leadQuery);
            setLeads(res);
        }, 300);
        return () => clearTimeout(timer);
    }, [leadQuery, open]);

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Destinatario</p>
                        <p className="text-lg font-black text-white">{currentLeadName || 'Seleziona cliente...'}</p>
                        <p className="text-[11px] font-medium text-indigo-200/60">{currentLeadEmail || 'Nessuna mail associata'}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-4 rounded-[1.2rem] bg-white/5 border-white/10 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest">
                                <Search className="mr-2 h-4 w-4" /> Cambia
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 rounded-2xl p-2 shadow-2xl border-slate-100 font-bold" align="end">
                            <div className="p-2 border-b border-slate-50 mb-1 sticky top-0 bg-white z-10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Cerca cliente..." 
                                        className="h-9 pl-9 rounded-xl border-slate-100 bg-slate-50 text-[11px]" 
                                        value={leadQuery}
                                        onChange={(e) => setLeadQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {leads.length === 0 ? (
                                    <p className="p-4 text-center text-[10px] text-slate-400 uppercase font-black">
                                        {leadQuery.length < 2 ? "Digita per cercare..." : "Nessun risultato"}
                                    </p>
                                ) : (
                                    leads.map(lead => (
                                        <DropdownMenuItem 
                                            key={lead.id} 
                                            onClick={() => {
                                                onSelect(lead.id);
                                                setOpen(false);
                                            }} 
                                            className="rounded-xl p-3 cursor-pointer hover:bg-indigo-50"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">{lead.firstName} {lead.lastName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{lead.email || '-'}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
