'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Euro, Receipt, Wallet, Plus, Trash2, Calendar as CalendarIcon, CreditCard, Banknote } from "lucide-react"
import { formatITDate } from "@/lib/utils"
import { addPayment, deletePayment } from "@/actions/finance"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Progress } from "@/components/ui/progress"

interface LeadFinanceTabProps {
    lead: any;
}

export function LeadFinanceTab({ lead }: LeadFinanceTabProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("BONIFICO");
    const [notes, setNotes] = useState("");
    const [quoteId, setQuoteId] = useState<string | null>(null);

    // Calcoli finanziari ultra-sicuri
    const acceptedQuotes = (lead.quotes || []).filter((q: any) => q.status === 'ACCETTATO');
    const totalBudget = acceptedQuotes.reduce((acc: number, q: any) => acc + Number(q.totalAmount || 0), 0);
    const totalPaid = (lead.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const balance = totalBudget - totalPaid;
    const progressPercent = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;
    const isFullyPaid = totalBudget > 0 && balance <= 0;

    const handleAddPayment = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Inserisci un importo valido");
            return;
        }

        setLoading(true);
        try {
            const res = await addPayment(quoteId, Number(amount), method, notes, lead.id);
            if (res.success) {
                toast.success("Incasso registrato con successo");
                setIsAddOpen(false);
                setAmount("");
                setNotes("");
                router.refresh();
            }
        } catch (error) {
            toast.error("Errore nella registrazione");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo incasso?")) return;
        
        try {
            await deletePayment(id, lead.id);
            toast.success("Incasso eliminato");
            router.refresh();
        } catch (error) {
            toast.error("Errore nell'eliminazione");
        }
    };

    return (
        <div className="space-y-8 pt-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Riepilogo Finanziario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-slate-200/60 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <Receipt className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Totale</p>
                                <p className="text-2xl font-black text-slate-900">€{totalBudget.toLocaleString('it-IT')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/60 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <Euro className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Incassato</p>
                                <p className="text-2xl font-black text-emerald-600">€{totalPaid.toLocaleString('it-IT')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200/60 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Rimanente</p>
                                <p className="text-2xl font-black text-amber-600">€{balance.toLocaleString('it-IT')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* BARRA DI AVANZAMENTO E SALDO ROSSO */}
            {totalBudget > 0 && (
                <Card className="rounded-[2.5rem] border border-slate-200/60 bg-white p-8 shadow-sm">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avanzamento Globale Pagamenti</h4>
                            <span className="text-sm font-black text-slate-900">€{totalPaid.toLocaleString()} / €{totalBudget.toLocaleString()}</span>
                        </div>
                        <Progress value={progressPercent} className="h-3 rounded-full bg-slate-100" />
                        <div className="flex justify-between items-center">
                            {!isFullyPaid ? (
                                <p className="text-sm font-black text-rose-600 uppercase italic tracking-tight">
                                    🔴 Mancano €{balance.toLocaleString()} per saldare la posizione
                                </p>
                            ) : (
                                <p className="text-sm font-black text-emerald-600 uppercase italic tracking-tight">
                                    🟢 Congratulazioni! Cliente ha saldato tutto
                                </p>
                            )}
                            <Badge variant="outline" className="rounded-lg text-[10px] font-bold py-1">
                                {Math.floor(progressPercent)}% Completato
                            </Badge>
                        </div>
                    </div>
                </Card>
            )}

            {/* Tabella Pagamenti */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Storico Transazioni</h3>
                    
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
                                <Plus className="h-4 w-4" /> Registra Incasso
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Nuovo Incasso</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Importo (€)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="rounded-xl h-12 font-bold text-lg" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Metodo</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="rounded-xl h-12 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BONIFICO">Bonifico</SelectItem>
                                            <SelectItem value="CONTANTI">Contanti</SelectItem>
                                            <SelectItem value="CARTA">Carta / POS</SelectItem>
                                            <SelectItem value="ASSEGNO">Assegno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Collega a Preventivo (Opzionale)</Label>
                                    <Select onValueChange={(val) => setQuoteId(val === 'none' ? null : val)}>
                                        <SelectTrigger className="rounded-xl h-12">
                                            <SelectValue placeholder="Incasso generico" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Incasso generico (nessun preventivo)</SelectItem>
                                            {acceptedQuotes.map((q: any) => (
                                                <SelectItem key={q.id} value={q.id}>
                                                    Preventivo #{q.number} (€{Number(q.totalAmount).toLocaleString()})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-400">Note</Label>
                                    <Input 
                                        placeholder="Esempio: Acconto Showroom" 
                                        className="rounded-xl h-12" 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    className="w-full rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={handleAddPayment}
                                    disabled={loading}
                                >
                                    {loading ? "Registrazione..." : "Conferma Incasso"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400">Data</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400">Metodo</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400">Puntatore</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-slate-400">Note</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase text-slate-400">Importo</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lead.payments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">
                                        Nessun incasso registrato per questo cliente.
                                    </TableCell>
                                </TableRow>
                            )}
                            {lead.payments.map((p: any) => (
                                <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-bold text-slate-600 text-xs">
                                        {formatITDate(p.date)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-tight bg-white border-slate-200">
                                            {p.method === 'BONIFICO' && <CreditCard className="h-3 w-3 mr-1 text-blue-500" />}
                                            {p.method === 'CONTANTI' && <Banknote className="h-3 w-3 mr-1 text-emerald-500" />}
                                            {p.method}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-400">
                                        {p.quoteId ? `Prev. #${lead.quotes.find((q: any) => q.id === p.quoteId)?.number}` : "Generico"}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                                        {p.notes || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-slate-900">
                                        €{Number(p.amount).toLocaleString('it-IT')}
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
