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
    ArrowRightLeft, Download, Upload, FileSpreadsheet, Trash2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    addGuest, updateGuest, deleteGuest, togglePresence, getGuests, bulkAddGuests, clearGuests
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
            // Calcolo immediato dello stock aggiornato per notifica
            const updatedGuests = guests.map((g: any) => g.id === guestId ? { ...g, [field]: value } : g);
            setGuests(updatedGuests);

            if (value) {
                // Cerchiamo la portata per questo valore
                const dealField = field === 'baseColor' ? deal.favor1_colors : 
                                 field === 'stickColor' ? deal.favor1_stick : 
                                 field === 'scent' ? deal.favor1_scents : 
                                 field === 'graphic' ? deal.favor1_graphics : '';
                
                const options = parseOptions(dealField);
                const opt = options.find((o: any) => o.name === value);
                
                if (opt) {
                    const totalAvailable = parseInt(opt.qty) || 0;
                    const chosenCount = updatedGuests.filter((g: any) => g[field] === value).length;
                    const remaining = totalAvailable - chosenCount;

                    if (remaining <= 6 && remaining >= 0) {
                        const status = remaining <= 3 ? "CRITICO" : "ATTENZIONE";
                        const color = remaining <= 3 ? "text-rose-600" : "text-amber-600";
                        
                        toast.error(
                            <div className="flex flex-col gap-1">
                                <span className={`font-black text-[10px] uppercase tracking-widest ${color}`}>{status} STOCK</span>
                                <p className="text-sm font-bold">{value} sta terminando!</p>
                                <p className="text-[10px] font-black uppercase text-slate-400">Restano solo {remaining} pezzi</p>
                            </div>
                        );
                    }
                }
            }
        }
    };

    const handleToggleCompleted = async (guestId: string, current: boolean) => {
        const res = await updateGuest(guestId, { isCompleted: !current });
        if (res.success) {
            setGuests(guests.map((g: any) => g.id === guestId ? { ...g, isCompleted: !current } : g));
            if (!current) toast.success("Prodotto pronto!");
        }
    };

    const parseOptions = (str: string) => {
        if (!str) return [];
        return str.split(',').map(opt => {
            const [name, qty] = opt.split(':');
            return { name: name.trim(), qty: qty?.trim() };
        });
    };

    const [sortBy, setSortBy] = useState<'name' | 'missing'>('name');

    // Funzione helper per l'ordinamento
    const sortGuests = (list: any[]) => {
        return [...list].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                // Chi manca (parametri non scelti) va in alto
                const aMissing = !(a.baseColor && a.stickColor && a.scent && a.graphic);
                const bMissing = !(b.baseColor && b.stickColor && b.scent && b.graphic);
                if (aMissing && !bMissing) return -1;
                if (!aMissing && bMissing) return 1;
                return a.name.localeCompare(b.name);
            }
        });
    };

    const filteredGuests = sortGuests(
        guests.filter((g: any) => 
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const sortedConfigGuests = sortGuests(
        guests.filter((g: any) => g.isPresent)
    );

    const handleClearList = async () => {
        if (confirm("Sei sicuro di voler cancellare TUTTA la lista? Questa operazione non è reversibile.")) {
            setLoading(true);
            const res = await clearGuests(deal.id);
            setLoading(false);
            if (res.success) {
                setGuests([]);
                toast.success("Lista svuotata!");
            }
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
                                    const updates: any = { isPresent: true };
                                    if (tag) updates.tags = [tag];
                                    await updateGuest(guestId, updates);
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
            // Split by any newline sequence (CRLF or LF)
            const lines = text.split(/\r?\n/);
            const newGuests: any[] = [];

            // Saltiamo l'header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Split by comma e trim dei valori
                const parts = line.split(',');
                const name = parts[0]?.trim();
                const tag = parts[1]?.trim();

                if (name) {
                    newGuests.push({ name, tag });
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
        // Reset input
        e.target.value = '';
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {[
                                    { label: 'Barattolo', value: deal.favor1_colors, icon: Package },
                                    { label: 'Stick', value: deal.favor1_stick, icon: ListChecks },
                                    { label: 'Profumo', value: deal.favor1_scents, icon: Settings },
                                    { label: 'Grafica', value: deal.favor1_graphics, icon: TagIcon }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">{item.label}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {parseOptions(item.value).length > 0 ? parseOptions(item.value).map((opt: any, i: number) => (
                                                <div key={i} className="flex items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 gap-3 group hover:bg-indigo-600 transition-all cursor-default shadow-lg shadow-black/20">
                                                    <span className="text-sm font-black text-white tracking-tight uppercase italic">{opt.name}</span>
                                                    {opt.qty && (
                                                        <div className="bg-indigo-500 text-white text-[10px] font-black h-5 px-2 rounded-lg flex items-center justify-center min-w-[24px]">
                                                            {opt.qty}
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (
                                                <span className="text-[10px] font-bold text-white/20 italic uppercase tracking-widest">Opzioni non definite</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
                                    className="rounded-xl bg-slate-50 border-none font-bold text-xs"
                                />
                            </Card>

                            <Button 
                                variant="ghost" 
                                onClick={handleClearList}
                                disabled={loading || guests.length === 0}
                                className="w-full h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Svuota Lista
                            </Button>
                        </div>

                        {/* List View */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Summary Stats for Invitati */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="grid grid-cols-3 gap-4 flex-1">
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Totale Lista</span>
                                        <p className="text-3xl font-black text-slate-900">{guests.length}</p>
                                    </Card>
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-indigo-500">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Totale Gift</span>
                                        <p className="text-3xl font-black text-indigo-600">{guests.filter((g: any) => g.tags?.includes("GIFT")).length}</p>
                                    </Card>
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-rose-500">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Assenti</span>
                                        <p className="text-3xl font-black text-rose-600">{guests.filter((g: any) => !g.isPresent).length}</p>
                                    </Card>
                                </div>

                                <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 p-4 flex flex-col justify-center gap-2 min-w-[200px]">
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest px-2">Ordina per</span>
                                    <div className="flex bg-white/5 rounded-xl p-1">
                                        <button 
                                            onClick={() => setSortBy('name')}
                                            className={cn(
                                                "flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                sortBy === 'name' ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Nome
                                        </button>
                                        <button 
                                            onClick={() => setSortBy('missing')}
                                            className={cn(
                                                "flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                sortBy === 'missing' ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Da Fare
                                        </button>
                                    </div>
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
                                                            guest.isServed ? "bg-emerald-50/50" : (guest.isPresent ? "bg-white" : "opacity-80 bg-rose-50/20")
                                                        )}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <button 
                                                                onClick={() => handleTogglePresence(guest.id, guest.isPresent)}
                                                                className={cn(
                                                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                                                    guest.isPresent 
                                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                                                        : "bg-rose-500 text-white shadow-lg shadow-rose-100"
                                                                )}
                                                            >
                                                                {guest.isPresent ? <UserCheck className="h-5 w-5" /> : <UserMinus className="h-5 w-5" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-slate-900 uppercase italic leading-none">{guest.name}</span>
                                                                    {!(guest.baseColor && guest.stickColor && guest.scent && guest.graphic) && (
                                                                        <Badge className="bg-rose-50 text-rose-500 border-none text-[7px] font-black px-1.5 py-0 uppercase">Incompleto</Badge>
                                                                    )}
                                                                </div>
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
                                                                    onClick={() => setEditingGuest(guest)}
                                                                    className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                                >
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
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
                        {/* Sidebar: Configuratore & Stock Monitor */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-6 space-y-6">
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
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                    <span className="text-[8px] font-black uppercase text-white/30 tracking-widest block mb-2">Invitato Selezionato</span>
                                                    <p className="text-sm font-black uppercase italic text-indigo-400">{filteredGuests.filter((g: any) => g.isPresent)[0].name}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    {[
                                                        { label: 'Barattolo (Base)', field: 'baseColor', options: deal.favor1_colors },
                                                        { label: 'Stick', field: 'stickColor', options: deal.favor1_stick },
                                                        { label: 'Profumo', field: 'scent', options: deal.favor1_scents },
                                                        { label: 'Grafica', field: 'graphic', options: deal.favor1_graphics }
                                                    ].map((cfg) => (
                                                        <div key={cfg.field} className="space-y-1.5">
                                                            <Label className="text-[8px] font-black uppercase text-white/40 tracking-widest">{cfg.label}</Label>
                                                            <select 
                                                                className="w-full bg-white/5 border-none h-10 rounded-xl px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                                onChange={(e) => {
                                                                    const gid = filteredGuests.filter((g: any) => g.isPresent)[0].id;
                                                                    handleUpdateGuestSelection(gid, cfg.field, e.target.value);
                                                                }}
                                                                value={filteredGuests.filter((g: any) => g.isPresent)[0][cfg.field] || ""}
                                                            >
                                                                <option value="">Scegli...</option>
                                                                {cfg.options?.split(',').map((opt: string) => (
                                                                    <option key={opt} value={opt.split(':')[0]}>{opt.split(':')[0]}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center border-2 border-dashed border-white/10 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase text-white/20">Nessun invitato presente trovato</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 p-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Monitor Stock</span>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Barattoli', value: deal.favor1_colors, field: 'baseColor' },
                                            { label: 'Stick', value: deal.favor1_stick, field: 'stickColor' },
                                            { label: 'Profumi', value: deal.favor1_scents, field: 'scent' },
                                            { label: 'Grafiche', value: deal.favor1_graphics, field: 'graphic' }
                                        ].map((cat, idx) => {
                                            const options = parseOptions(cat.value);
                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{cat.label}</span>
                                                        <span className="text-[8px] font-bold text-white/20 uppercase italic">Disp. / Scelta</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {options.length > 0 ? options.map((opt: any) => {
                                                            const chosenCount = guests.filter((g: any) => g[cat.field] === opt.name).length;
                                                            const totalAvailable = parseInt(opt.qty) || 0;
                                                            const remaining = totalAvailable - chosenCount;
                                                            
                                                            let statusColor = "text-emerald-400";
                                                            if (remaining <= 3) statusColor = "text-rose-500";
                                                            else if (remaining <= 6) statusColor = "text-amber-400";

                                                            return (
                                                                <div key={opt.name} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors">
                                                                    <span className="text-[11px] font-bold text-white/80">{opt.name}</span>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[11px] font-black text-white/20">{totalAvailable}</span>
                                                                        <div className="h-3 w-px bg-white/10" />
                                                                        <span className={cn("text-[14px] font-black", statusColor)}>
                                                                            {chosenCount}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <span className="text-[9px] text-white/10 italic">Nessuna opzione</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Configurator Table View */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Summary Stats for Configuratore */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="grid grid-cols-3 gap-4 flex-1">
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Totale Lista</span>
                                        <p className="text-3xl font-black text-slate-900">{guests.length}</p>
                                    </Card>
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-emerald-500">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Presenti</span>
                                        <p className="text-3xl font-black text-emerald-600">{guests.filter((g: any) => g.isPresent).length}</p>
                                    </Card>
                                    <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-rose-500">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Mancanti</span>
                                        <p className="text-3xl font-black text-rose-600">{guests.length - guests.filter((g: any) => g.isPresent).length}</p>
                                    </Card>
                                </div>
                                
                                <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 p-4 flex flex-col justify-center gap-2 min-w-[200px]">
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest px-2">Ordina per</span>
                                    <div className="flex bg-white/5 rounded-xl p-1">
                                        <button 
                                            onClick={() => setSortBy('name')}
                                            className={cn(
                                                "flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                sortBy === 'name' ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Nome
                                        </button>
                                        <button 
                                            onClick={() => setSortBy('missing')}
                                            className={cn(
                                                "flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                sortBy === 'missing' ? "bg-indigo-600 text-white shadow-lg" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Da Fare
                                        </button>
                                    </div>
                                </Card>
                            </div>

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
                                            {sortedConfigGuests.map((guest: any) => (
                                                <tr 
                                                    key={guest.id} 
                                                    className={cn(
                                                        "transition-all duration-300", 
                                                        guest.isCompleted ? "bg-emerald-50 hover:bg-emerald-100/50" : "hover:bg-slate-50/50"
                                                    )}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "text-xs font-black uppercase italic",
                                                            guest.isCompleted ? "text-emerald-700" : "text-slate-900"
                                                        )}>
                                                            {guest.name}
                                                        </span>
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
                                                        <button 
                                                            onClick={() => handleUpdateGuestSelection(guest.id, 'ammStatus', guest.ammStatus === 'A' ? '' : 'A')}
                                                            className={cn(
                                                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all border-2",
                                                                guest.ammStatus === 'A' 
                                                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-100" 
                                                                    : "bg-white border-slate-200 text-slate-200 hover:border-slate-400 hover:text-slate-500"
                                                            )}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
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
                <TabsContent value="produzione" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {/* Summary Stats for Produzione */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="rounded-3xl border-none shadow-sm bg-white p-6">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Presenti</span>
                            <p className="text-3xl font-black text-slate-900">{guests.filter((g: any) => g.isPresent).length}</p>
                        </Card>
                        <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-amber-500">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Configurati</span>
                            <p className="text-3xl font-black text-amber-600">{guests.filter((g: any) => g.isPresent && (g.baseColor || g.scent)).length}</p>
                        </Card>
                        <Card className="rounded-3xl border-none shadow-sm bg-white p-6 border-l-4 border-l-emerald-500">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Pronti</span>
                            <p className="text-3xl font-black text-emerald-600">{guests.filter((g: any) => g.isCompleted).length}</p>
                        </Card>
                    </div>

                    {guests.filter((g: any) => g.isPresent).length === guests.filter((g: any) => g.isCompleted).length && guests.filter((g: any) => g.isPresent).length > 0 && (
                        <div className="bg-emerald-600 text-white p-4 rounded-3xl flex items-center justify-center gap-3 animate-in zoom-in duration-500 shadow-xl shadow-emerald-100">
                            <CheckCircle2 className="h-6 w-6" />
                            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Produzione Completata! Ottimo lavoro.</span>
                        </div>
                    )}

                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest w-20">PRONTO</th>
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
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all border-2",
                                                        guest.isCompleted 
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                                            : "bg-white border-slate-200 text-slate-200 hover:border-emerald-200 hover:text-emerald-500"
                                                    )}
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm font-black uppercase italic transition-all",
                                                        guest.isCompleted ? "text-emerald-700" : "text-slate-900"
                                                    )}>
                                                        {guest.name}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AMM: {guest.ammStatus === 'A' ? 'SI' : 'NO'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {guest.baseColor && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-500 uppercase bg-slate-50">{guest.baseColor}</Badge>}
                                                    {guest.stickColor && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-500 uppercase bg-slate-50">{guest.stickColor}</Badge>}
                                                    {guest.scent && <Badge variant="outline" className="text-[8px] font-black border-indigo-100 text-indigo-600 uppercase bg-indigo-50">{guest.scent}</Badge>}
                                                    {guest.graphic && <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-500 uppercase bg-slate-50 italic">{guest.graphic}</Badge>}
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
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                        <TagIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Impostazioni Invitato</span>
                                        <Input 
                                            value={editingGuest.name}
                                            onChange={(e) => {
                                                const newName = e.target.value;
                                                setEditingGuest({...editingGuest, name: newName});
                                                handleUpdateGuestSelection(editingGuest.id, 'name', newName);
                                            }}
                                            className="bg-transparent border-none p-0 h-auto text-2xl font-black uppercase italic tracking-tight text-slate-900 focus-visible:ring-0 placeholder:text-slate-200"
                                            placeholder="Nome..."
                                        />
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

                                {/* Product Config for Single Guest */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Barattolo</Label>
                                        <Select 
                                            value={editingGuest.baseColor || ""} 
                                            onValueChange={(val) => {
                                                handleUpdateGuestSelection(editingGuest.id, 'baseColor', val);
                                                setEditingGuest({...editingGuest, baseColor: val});
                                            }}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                                                <SelectValue placeholder="Seleziona..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                {parseOptions(deal.favor1_colors).map(opt => (
                                                    <SelectItem key={opt.name} value={opt.name} className="font-bold">{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stick</Label>
                                        <Select 
                                            value={editingGuest.stickColor || ""} 
                                            onValueChange={(val) => {
                                                handleUpdateGuestSelection(editingGuest.id, 'stickColor', val);
                                                setEditingGuest({...editingGuest, stickColor: val});
                                            }}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                                                <SelectValue placeholder="Seleziona..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                {parseOptions(deal.favor1_stick).map(opt => (
                                                    <SelectItem key={opt.name} value={opt.name} className="font-bold">{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Profumo</Label>
                                        <Select 
                                            value={editingGuest.scent || ""} 
                                            onValueChange={(val) => {
                                                handleUpdateGuestSelection(editingGuest.id, 'scent', val);
                                                setEditingGuest({...editingGuest, scent: val});
                                            }}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                                                <SelectValue placeholder="Seleziona..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                {parseOptions(deal.favor1_scents).map(opt => (
                                                    <SelectItem key={opt.name} value={opt.name} className="font-bold">{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grafica</Label>
                                        <Select 
                                            value={editingGuest.graphic || ""} 
                                            onValueChange={(val) => {
                                                handleUpdateGuestSelection(editingGuest.id, 'graphic', val);
                                                setEditingGuest({...editingGuest, graphic: val});
                                            }}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                                                <SelectValue placeholder="Seleziona..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                {parseOptions(deal.favor1_graphics).map(opt => (
                                                    <SelectItem key={opt.name} value={opt.name} className="font-bold">{opt.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
