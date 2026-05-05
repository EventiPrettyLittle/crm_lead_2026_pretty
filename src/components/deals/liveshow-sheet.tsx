'use client'

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Plus, Search, Check, X, User, Users, Sparkles, 
    Settings, Package, ListChecks, ArrowLeft, Loader2,
    CheckCircle2, UserCheck, UserMinus, Tag as TagIcon,
    ArrowRightLeft, Download, Upload, FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { 
    addGuest, updateGuest, deleteGuest, togglePresence, getGuests, bulkAddGuests
} from "@/actions/liveshow";
import { cn } from "@/lib/utils";

interface LiveShowSheetProps {
    initialDeal: any;
}

export function LiveShowSheet({ initialDeal }: LiveShowSheetProps) {
    const [deal, setDeal] = useState(initialDeal);
    const [guests, setGuests] = useState(initialDeal.guests || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [newGuestName, setNewGuestName] = useState("");
    const [loading, setLoading] = useState(false);
    
    const lead = deal.lead || {};
    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`;

    // --- LOGICA LISTA INVITATI ---
    const handleAddGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;
        
        setLoading(true);
        const res = await addGuest(deal.id, newGuestName);
        setLoading(false);
        
        if (res.success) {
            setGuests([...guests, res.data]);
            setNewGuestName("");
            toast.success("Invitato aggiunto!");
        } else {
            toast.error("Errore: " + res.error);
        }
    };

    const handleTogglePresence = async (guestId: string, current: boolean) => {
        const res = await togglePresence(guestId, !current);
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, isPresent: !current } : g));
            toast.success(!current ? "Invitato presente" : "Presenza rimossa");
        }
    };

    // --- FILTRO INVITATI ---
    const filteredGuests = guests.filter((g: any) => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [editingGuest, setEditingGuest] = useState<any>(null);

    const handleUpdateTags = async (guestId: string, tag: string) => {
        const guest = guests.find((g: any) => g.id === guestId);
        if (!guest) return;

        let newTags = [...(guest.tags || [])];
        if (newTags.includes(tag)) {
            newTags = newTags.filter(t => t !== tag);
        } else {
            newTags.push(tag);
        }

        const res = await updateGuest(guestId, { tags: newTags });
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, tags: newTags } : g));
        }
    };

    const handleSetChoosesFor = async (guestId: string, targets: string[]) => {
        const res = await updateGuest(guestId, { choosesFor: JSON.stringify(targets) });
        if (res.success) {
            // Aggiorniamo anche i target per segnare che sono scelti da questo guest
            // In un sistema reale useremmo una transazione, qui facciamo update individuali o gestiamo lato UI
            setGuests(guests.map((g: any) => {
                if (g.id === guestId) return { ...g, choosesFor: JSON.stringify(targets) };
                if (targets.includes(g.id)) return { ...g, chosenBy: guests.find((x: any) => x.id === guestId).name };
                return g;
            }));
            toast.success("Collegamenti aggiornati!");
        }
    };

    const AVAILABLE_TAGS = ["GIFT", "TESTIMONE", "PADRE SPOSO", "PADRE SPOSA", "MAMMA SPOSO", "MAMMA SPOSA", "NONNI"];

    const handleUpdateGuestSelection = async (guestId: string, field: string, value: string) => {
        const res = await updateGuest(guestId, { [field]: value });
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, [field]: value } : g));
        }
    };

    const handleToggleCompleted = async (guestId: string, current: boolean) => {
        const res = await updateGuest(guestId, { isCompleted: !current });
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, isCompleted: !current } : g));
            if (!current) toast.success("Prodotto pronto!");
        }
    };

    // --- AUTO-IMPORT REFERENTI ---
    useEffect(() => {
        const importReferents = async () => {
            if (guests.length === 0 && lead.referents) {
                try {
                    const refs = JSON.parse(lead.referents);
                    if (refs && refs.length > 0) {
                        setLoading(true);
                        for (const ref of refs) {
                            if (ref.name) {
                                const res = await addGuest(deal.id, ref.name);
                                if (res.success && res.data) {
                                    // Aggiungiamo il tag basato sul ruolo
                                    const guestId = res.data.id;
                                    const tag = ref.role?.toUpperCase();
                                    if (tag) {
                                        await updateGuest(guestId, { tags: [tag] });
                                    }
                                }
                            }
                        }
                        // Ricarichiamo i guest
                        const updatedGuests = await getGuests(deal.id);
                        setGuests(updatedGuests);
                        toast.success("Referenti importati automaticamente dal Deal!");
                        setLoading(false);
                    }
                } catch (e) {
                    console.error("Error importing referents:", e);
                }
            }
        };

        importReferents();
    }, [deal.id, lead.referents, guests.length]);

    const handleToggleServed = async (guestId: string, current: boolean) => {
        const res = await updateGuest(guestId, { isServed: !current });
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, isServed: !current } : g));
            if (!current) toast.success("Ospite servito!");
        }
    };

    const downloadCsvTemplate = () => {
        const content = "Nome,Tag\nMario Rossi,GIFT\nGiulia Bianchi,TESTIMONE";
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "template_invitati_liveshow.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const newGuests: any[] = [];

            // Saltiamo l'header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const [name, tag] = line.split(',');
                if (name) {
                    newGuests.push({ name: name.trim(), tag: tag?.trim() });
                }
            }

            if (newGuests.length > 0) {
                setLoading(true);
                const res = await bulkAddGuests(deal.id, newGuests);
                setLoading(false);
                
                if (res.success) {
                    const updated = await getGuests(deal.id);
                    setGuests(updated);
                    toast.success(`Importati ${res.count} invitati!`);
                } else {
                    toast.error("Errore importazione: " + res.error);
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* ... */}
            {/* Header ... */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Live Show Operativo</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild className="p-2 h-auto rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                            <Link href="/liveshow">
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                        </Button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                            {leadName}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Evento</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 rounded-lg px-3 py-1 font-black text-[10px] uppercase">
                            Live In Progress
                        </Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="invitati" className="space-y-6">
                <TabsList className="bg-white/50 backdrop-blur-xl p-1 rounded-2xl border border-slate-100 shadow-sm h-14 w-full md:w-auto grid grid-cols-4 gap-1">
                    <TabsTrigger value="riepilogo" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Riepilogo
                    </TabsTrigger>
                    <TabsTrigger value="invitati" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Invitati
                    </TabsTrigger>
                    <TabsTrigger value="configuratore" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Configuratore
                    </TabsTrigger>
                    <TabsTrigger value="produzione" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                        Produzione
                    </TabsTrigger>
                </TabsList>

                {/* --- RIEPILOGO --- */}
                <TabsContent value="riepilogo" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
                            <CardHeader className="p-0 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Affluenza</span>
                                        <CardTitle className="text-xl font-black uppercase italic tracking-tight">Presenze</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-slate-900 tracking-tighter">
                                    {guests.filter((g: any) => g.isPresent).length}
                                </span>
                                <span className="text-xl font-black text-slate-300 uppercase italic">/ {guests.length}</span>
                            </div>
                            <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-indigo-600 h-full transition-all duration-1000" 
                                    style={{ width: `${guests.length > 0 ? (guests.filter((g: any) => g.isPresent).length / guests.length) * 100 : 0}%` }}
                                />
                            </div>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-8 md:col-span-2">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none mb-1">Configurazione Deal</span>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Opzioni Disponibili</h3>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Barattolo</span>
                                    <p className="text-sm font-bold text-indigo-400">{deal.favor1_colors || "Non impostato"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Stick</span>
                                    <p className="text-sm font-bold text-indigo-400">{deal.favor1_stick || "Non impostato"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Profumo</span>
                                    <p className="text-sm font-bold text-indigo-400">{deal.favor1_scents || "Non impostato"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Grafica</span>
                                    <p className="text-sm font-bold text-indigo-400">{deal.favor1_graphics || "Non impostato"}</p>
                                </div>
                            </div>
                            
                            <Separator className="bg-white/10 my-6" />
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Data Evento</span>
                                        <p className="text-xs font-black uppercase text-indigo-300">{lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Da definire'}</p>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Location</span>
                                        <p className="text-xs font-black uppercase text-indigo-300">{lead.locationName || 'Nessuna location'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Orario Arrivo</span>
                                    <p className="text-xs font-black uppercase text-indigo-300">{deal.arrivalTime || '--:--'}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- LISTA INVITATI --- */}
                <TabsContent value="invitati" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar: Add & Search */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Plus className="h-4 w-4 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggiungi Invitato</span>
                                </div>
                                <form onSubmit={handleAddGuest} className="space-y-3">
                                    <Input 
                                        placeholder="Nome e Cognome..." 
                                        value={newGuestName}
                                        onChange={(e) => setNewGuestName(e.target.value)}
                                        className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus:bg-white transition-all shadow-inner"
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi alla lista"}
                                    </Button>
                                </form>
                            </Card>

                            <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-600 p-6 space-y-4 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileSpreadsheet className="h-4 w-4 text-indigo-200" />
                                    <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Importa CSV</span>
                                </div>
                                <div className="space-y-3">
                                    <Button 
                                        variant="ghost" 
                                        onClick={downloadCsvTemplate}
                                        className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] uppercase tracking-widest transition-all"
                                    >
                                        <Download className="h-3.5 w-3.5 mr-2" /> Scarica Template
                                    </Button>
                                    
                                    <label className="flex flex-col items-center justify-center w-full h-24 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 cursor-pointer transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="h-5 w-5 text-indigo-200 mb-2" />
                                            <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest text-center px-4">
                                                {loading ? "Importazione..." : "Seleziona File CSV"}
                                            </p>
                                        </div>
                                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} disabled={loading} />
                                    </label>
                                </div>
                            </Card>

                            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cerca Invitato</span>
                                </div>
                                <Input 
                                    placeholder="Filtra per nome..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus:bg-white transition-all shadow-inner"
                                />
                            </Card>
                        </div>

                        {/* List View */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Summary Stats for Invitati */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Totale Lista</span>
                                    <p className="text-3xl font-black text-slate-900">{guests.length}</p>
                                </Card>
                                <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-emerald-500">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Presenti</span>
                                    <p className="text-3xl font-black text-emerald-600">{guests.filter((g: any) => g.isPresent).length}</p>
                                </Card>
                                <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-indigo-500">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Totale Gift</span>
                                    <p className="text-3xl font-black text-indigo-600">{guests.filter((g: any) => g.tags?.includes("GIFT")).length}</p>
                                </Card>
                            </div>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Invitato</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Tag & Note</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Sceglie per</th>
                                                <th className="px-6 py-4 text-right text-[9px] font-black uppercase text-slate-400 tracking-widest">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredGuests.map((guest: any) => {
                                                const choosesForList = guest.choosesFor ? JSON.parse(guest.choosesFor) : [];
                                                return (
                                                    <tr 
                                                        key={guest.id} 
                                                        className={cn(
                                                            "group transition-all duration-300", 
                                                            guest.isServed ? "bg-emerald-50/50" : (guest.isPresent ? "bg-white" : "opacity-60 hover:bg-slate-50/50")
                                                        )}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <button 
                                                                onClick={() => handleTogglePresence(guest.id, guest.isPresent)}
                                                                className={cn(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                                                    guest.isPresent 
                                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                                                        : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                                                                )}
                                                            >
                                                                {guest.isPresent ? <UserCheck className="h-5 w-5" /> : <UserMinus className="h-5 w-5" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-900 uppercase italic leading-none">{guest.name}</span>
                                                                {guest.chosenBy && (
                                                                    <span className="text-[8px] font-black text-indigo-500 uppercase mt-1 animate-pulse">
                                                                        SCELTO DA: {guest.chosenBy}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1">
                                                                {guest.tags?.map((tag: string) => (
                                                                    <Badge key={tag} className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black px-1.5 py-0">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                                <button 
                                                                    onClick={() => setEditingGuest(guest)}
                                                                    className="h-5 w-5 rounded-md bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center"
                                                                >
                                                                    <TagIcon className="h-2.5 w-2.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                {choosesForList.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {choosesForList.map((targetId: string) => {
                                                                            const target = guests.find((g: any) => g.id === targetId);
                                                                            return (
                                                                                <Badge key={targetId} variant="outline" className="text-[8px] font-bold border-indigo-100 text-indigo-400">
                                                                                    {target?.name || targetId}
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => setEditingGuest(guest)}
                                                                        className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                                                                    >
                                                                        <ArrowRightLeft className="h-3 w-3" />
                                                                        <span className="text-[9px] font-black uppercase tracking-tight italic">Collega...</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    onClick={() => handleToggleServed(guest.id, guest.isServed)}
                                                                    className={cn(
                                                                        "h-8 w-8 p-0 rounded-lg transition-all",
                                                                        guest.isServed ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "text-slate-300 hover:text-emerald-500 hover:bg-emerald-50"
                                                                    )}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    onClick={async () => {
                                                                        if (confirm("Eliminare invitato?")) {
                                                                            const res = await deleteGuest(guest.id, deal.id);
                                                                            if (res.success) setGuests(guests.filter((g: any) => g.id !== guest.id));
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- CONFIGURATORE --- */}
                <TabsContent value="configuratore" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Quick Selection Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-6 space-y-6 sticky top-24">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <Sparkles className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Configuratore Rapido</span>
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight">Selezione Prodotto</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Cerca Invitato Presente</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                            <Input 
                                                placeholder="Scrivi il nome..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-white/5 border-none h-12 pl-10 rounded-xl font-bold text-sm focus:ring-1 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {filteredGuests.filter((g: any) => g.isPresent).length > 0 ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                            {/* Mostriamo solo il primo o una lista selezionabile? L'utente dice "barra di ricerca e poi riempire parametri" */}
                                            {/* Prendo il primo dei filtrati se ce n'è uno solo o se l'utente clicca */}
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block mb-2">Invitato Selezionato</span>
                                                <p className="text-sm font-black uppercase italic text-indigo-400">{filteredGuests.filter((g: any) => g.isPresent)[0].name}</p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[8px] font-black uppercase text-white/40 tracking-widest">Barattolo (Base)</Label>
                                                        <select 
                                                            className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                            onChange={(e) => {
                                                                const gid = filteredGuests.filter((g: any) => g.isPresent)[0].id;
                                                                handleUpdateGuestSelection(gid, 'baseColor', e.target.value);
                                                            }}
                                                            value={filteredGuests.filter((g: any) => g.isPresent)[0].baseColor || ""}
                                                        >
                                                            <option value="">Scegli...</option>
                                                            {deal.favor1_colors?.split(',').map((opt: string) => (
                                                                <option key={opt} value={opt.split(':')[0]}>{opt.split(':')[0]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[8px] font-black uppercase text-white/40 tracking-widest">Stick</Label>
                                                        <select 
                                                            className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                            onChange={(e) => {
                                                                const gid = filteredGuests.filter((g: any) => g.isPresent)[0].id;
                                                                handleUpdateGuestSelection(gid, 'stickColor', e.target.value);
                                                            }}
                                                            value={filteredGuests.filter((g: any) => g.isPresent)[0].stickColor || ""}
                                                        >
                                                            <option value="">Scegli...</option>
                                                            {deal.favor1_stick?.split(',').map((opt: string) => (
                                                                <option key={opt} value={opt.split(':')[0]}>{opt.split(':')[0]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[8px] font-black uppercase text-white/40 tracking-widest">Profumo</Label>
                                                        <select 
                                                            className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                            onChange={(e) => {
                                                                const gid = filteredGuests.filter((g: any) => g.isPresent)[0].id;
                                                                handleUpdateGuestSelection(gid, 'scent', e.target.value);
                                                            }}
                                                            value={filteredGuests.filter((g: any) => g.isPresent)[0].scent || ""}
                                                        >
                                                            <option value="">Scegli...</option>
                                                            {deal.favor1_scents?.split(',').map((opt: string) => (
                                                                <option key={opt} value={opt.split(':')[0]}>{opt.split(':')[0]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[8px] font-black uppercase text-white/40 tracking-widest">Grafica</Label>
                                                        <select 
                                                            className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                            onChange={(e) => {
                                                                const gid = filteredGuests.filter((g: any) => g.isPresent)[0].id;
                                                                handleUpdateGuestSelection(gid, 'graphic', e.target.value);
                                                            }}
                                                            value={filteredGuests.filter((g: any) => g.isPresent)[0].graphic || ""}
                                                        >
                                                            <option value="">Scegli...</option>
                                                            {deal.favor1_graphics?.split(',').map((opt: string) => (
                                                                <option key={opt} value={opt.split(':')[0]}>{opt.split(':')[0]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center border-2 border-dashed border-white/10 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase text-white/20">Nessun invitato presente trovato</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Configurator Table View */}
                        <div className="lg:col-span-3">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">NOME</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">BARATTOLO</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">STICK</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">PROFUMO</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">GRAFICA</th>
                                                <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">AMM</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {guests.filter((g: any) => g.isPresent).map((guest: any) => (
                                                <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-slate-900 uppercase italic">{guest.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-600">{guest.baseColor || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-600">{guest.stickColor || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-600">{guest.scent || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-slate-600">{guest.graphic || "-"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Input 
                                                            value={guest.ammStatus || ""} 
                                                            onChange={(e) => handleUpdateGuestSelection(guest.id, 'ammStatus', e.target.value)}
                                                            className="h-8 w-20 bg-slate-50 border-none text-[10px] font-black text-center"
                                                            placeholder="..."
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                            {guests.filter((g: any) => g.isPresent).length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic font-medium uppercase text-xs">
                                                        Nessun invitato presente da configurare
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- PRODUZIONE --- */}
                <TabsContent value="produzione" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">PRONTO</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">INVITATO</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">CONFIGURAZIONE SCELTA</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">TAG</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {guests.filter((g: any) => g.isPresent).map((guest: any) => (
                                        <tr 
                                            key={guest.id} 
                                            className={cn(
                                                "transition-all duration-500",
                                                guest.isCompleted ? "bg-emerald-50/50" : "hover:bg-slate-50/50"
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => handleToggleCompleted(guest.id, guest.isCompleted)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border-2",
                                                        guest.isCompleted 
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                                            : "bg-white border-slate-200 text-slate-200 hover:border-emerald-200 hover:text-emerald-500"
                                                    )}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "text-sm font-black uppercase italic transition-all",
                                                    guest.isCompleted ? "text-emerald-700" : "text-slate-900"
                                                )}>
                                                    {guest.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {guest.baseColor && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 uppercase">{guest.baseColor}</Badge>}
                                                    {guest.stickColor && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 uppercase">{guest.stickColor}</Badge>}
                                                    {guest.scent && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 uppercase">{guest.scent}</Badge>}
                                                    {guest.graphic && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 uppercase">{guest.graphic}</Badge>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {guest.tags?.map((tag: string) => (
                                                        <Badge key={tag} className="bg-slate-100 text-slate-400 border-none text-[8px] font-black px-1.5 py-0 uppercase">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {guests.filter((g: any) => g.isPresent).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-slate-300 italic font-medium uppercase text-xs">
                                                Nessun prodotto in produzione
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- DIALOG EDIT INVITATO (TAGS & COLLEGAMENTI) --- */}
            {editingGuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <TagIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Impostazioni Invitato</span>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-900">{editingGuest.name}</h3>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setEditingGuest(null)} className="h-10 w-10 p-0 rounded-full hover:bg-slate-50 text-slate-400">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tag Invitato</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_TAGS.map(tag => {
                                            const isActive = editingGuest.tags?.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => {
                                                        handleUpdateTags(editingGuest.id, tag);
                                                        setEditingGuest({
                                                            ...editingGuest,
                                                            tags: isActive 
                                                                ? editingGuest.tags.filter((t: string) => t !== tag) 
                                                                : [...(editingGuest.tags || []), tag]
                                                        });
                                                    }}
                                                    className={cn(
                                                        "px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2",
                                                        isActive 
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-105" 
                                                            : "bg-slate-50 border-slate-50 text-slate-400 hover:border-indigo-100 hover:text-indigo-600"
                                                    )}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sceglie per (Collega altri invitati)</Label>
                                    <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                        {guests.filter((g: any) => g.id !== editingGuest.id).map((g: any) => {
                                            const currentChoosesFor = editingGuest.choosesFor ? JSON.parse(editingGuest.choosesFor) : [];
                                            const isSelected = currentChoosesFor.includes(g.id);
                                            return (
                                                <button
                                                    key={g.id}
                                                    onClick={() => {
                                                        const newTargets = isSelected 
                                                            ? currentChoosesFor.filter((id: string) => id !== g.id)
                                                            : [...currentChoosesFor, g.id];
                                                        handleSetChoosesFor(editingGuest.id, newTargets);
                                                        setEditingGuest({ ...editingGuest, choosesFor: JSON.stringify(newTargets) });
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-xl transition-all group text-left",
                                                        isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-300 group-hover:bg-white"
                                                        )}>
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <span className={cn("text-xs font-bold uppercase", isSelected ? "text-indigo-700" : "text-slate-600")}>
                                                            {g.name}
                                                        </span>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    onClick={() => setEditingGuest(null)}
                                    className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl"
                                >
                                    Chiudi e Salva
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
