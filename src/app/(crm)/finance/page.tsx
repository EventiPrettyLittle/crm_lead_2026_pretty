import { getAcceptedQuotes } from "@/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Euro, CreditCard, Clock, CheckCircle2, MoreHorizontal, Plus, Trash2, Wallet, ArrowRight, FileText } from "lucide-react";
import { AddPaymentDialog } from "@/components/finance/add-payment-dialog";
import { PaymentList } from "@/components/finance/payment-list";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function FinancePage() {
    const quotes = await getAcceptedQuotes();

    const totalToCollect = quotes.reduce((acc: number, q: any) => acc + Number(q.totalAmount || q.totalamount || 0), 0);
    const totalCollected = quotes.reduce((acc: number, q: any) => {
        const paymentsTotal = q.payments?.reduce((pAcc: number, p: any) => pAcc + Number(p.amount || 0), 0) || 0;
        return acc + paymentsTotal;
    }, 0);

    const allPayments = quotes.flatMap((q: any) => q.payments || []);
    const cashTotal = allPayments.filter((p: any) => p.method?.toUpperCase() === 'CONTANTI').reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const bankTotal = allPayments.filter((p: any) => p.method?.toUpperCase() === 'BONIFICO').reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const cardTotal = allPayments.filter((p: any) => ['CARTA', 'POS', 'LINK'].includes(p.method?.toUpperCase())).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
    const checkTotal = allPayments.filter((p: any) => p.method?.toUpperCase() === 'ASSEGNO').reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);


    const balance = totalToCollect - totalCollected;

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Gestione Finanziaria</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">
                        Incassi & <span className="text-indigo-600">Pagamenti</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg">Monitora i saldi e gestisci gli acconti dei clienti.</p>
                </div>
            </div>

            {/* Financial Stats Overlap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                <FileText className="h-7 w-7 text-indigo-600 group-hover:text-white" />
                            </div>
                            <Badge className="bg-slate-100 text-slate-500 border-none font-bold">DA INCASSARE</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Totale Lordo Accettato</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">€{totalToCollect.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <CardContent className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                <Wallet className="h-7 w-7 text-emerald-400 group-hover:text-white" />
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold">INCASSATO</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Totale Ricevuto</p>
                        <h3 className="text-4xl font-black text-white mt-1 italic tracking-tighter">€{totalCollected.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                        <div className="mt-4 flex items-center gap-2">
                             <Progress value={(totalCollected / totalToCollect) * 100} className="h-1.5 bg-white/5" />
                             <span className="text-[10px] font-black text-emerald-400">{Math.floor((totalCollected / (totalToCollect || 1)) * 100)}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 border-t border-white/5 pt-4">
                            {bankTotal > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Bonifici</span>
                                    <span className="text-[11px] font-black text-white">€{bankTotal.toLocaleString('it-IT')}</span>
                                </div>
                            )}
                            {cashTotal > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Contanti</span>
                                    <span className="text-[11px] font-black text-white">€{cashTotal.toLocaleString('it-IT')}</span>
                                </div>
                            )}
                            {cardTotal > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Carte/POS</span>
                                    <span className="text-[11px] font-black text-white">€{cardTotal.toLocaleString('it-IT')}</span>
                                </div>
                            )}
                            {checkTotal > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Assegni</span>
                                    <span className="text-[11px] font-black text-white">€{checkTotal.toLocaleString('it-IT')}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white group hover:shadow-2xl transition-all duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                                <Clock className="h-7 w-7 text-rose-500 group-hover:text-white" />
                            </div>
                            <Badge className="bg-rose-50 text-rose-600 border-none font-bold italic">RESIDUO</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Saldo Rimanente</p>
                        <h3 className="text-3xl font-black text-rose-600 mt-1 uppercase tracking-tighter">€{balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Orders & Payments Table */}
            <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-slate-900 italic">Dettaglio Ordini Attivi</h2>
                        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-black">
                            {quotes.length} ORDINI
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {quotes.length === 0 ? (
                         <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                             <Clock className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                             <p className="text-slate-400 font-bold uppercase tracking-widest">Nessun preventivo accettato da gestire</p>
                             <p className="text-slate-300 text-sm mt-2">Accetta un preventivo per vederlo apparire qui.</p>
                         </div>
                    ) : quotes.map((quote: any) => {
                        const paid = quote.payments?.reduce((acc: number, p: any) => acc + Number(p.amount || p.amount || 0), 0) || 0;
                        const totalAmount = Number(quote.totalAmount || quote.totalamount || 0);
                        const remaining = totalAmount - paid;
                        const isFullyPaid = remaining <= 0;

                        return (
                            <Card key={quote.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden hover:shadow-xl transition-all duration-500">
                                <CardContent className="p-0">
                                    <div className="flex flex-col lg:flex-row items-stretch">
                                        {/* Order Info Part */}
                                        <div className="lg:w-1/3 p-8 bg-slate-50/50 border-r border-slate-100 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ordine #{quote.number}</span>
                                                    <h4 className="text-2xl font-black text-slate-900 mt-1 italic">{quote.lead.firstName} {quote.lead.lastName}</h4>
                                                </div>
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    isFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    {isFullyPaid ? 'SALDATO' : 'IN SOSPESO'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Avanzamento Pagamenti</p>
                                                    <p className="text-sm font-black text-slate-900">€{paid.toLocaleString()} / €{totalAmount.toLocaleString()}</p>
                                                </div>
                                                <Progress value={(paid / totalAmount) * 100} className="h-2 bg-slate-200" />
                                                {!isFullyPaid ? (
                                                    <p className="text-[11px] font-black text-rose-600 uppercase tracking-tighter">
                                                        ⚠️ Residuo da incassare: €{remaining.toLocaleString()}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">
                                                        ✅ Ordine completamente saldato
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-4 flex items-center justify-between">
                                                <AddPaymentDialog quoteId={quote.id} leadId={quote.leadId} leadName={`${quote.lead.firstName} ${quote.lead.lastName}`} />
                                                <Button variant="ghost" size="sm" asChild className="h-10 rounded-xl font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Link href={`/leads/${quote.leadId}`}>
                                                        Vai al Lead <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Payments List Part */}
                                        <div className="lg:w-2/3 p-8">
                                            <div className="flex items-center gap-2 mb-6">
                                                <CreditCard className="h-4 w-4 text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronologia Versamenti</span>
                                            </div>
                                            
                                            <PaymentList payments={quote.payments} quoteId={quote.id} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


