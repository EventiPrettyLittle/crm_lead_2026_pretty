import { getQuotes } from "@/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Search, FileText, Eye, MoreHorizontal, Filter, Download, Mail, IndianRupee, Euro, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import QuoteBuilder from "@/components/quotes/quote-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateQuoteDialog } from "@/components/quotes/create-quote-dialog";
import { ProductManager } from "@/components/quotes/product-manager";

export default async function QuotesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    const quotes = await getQuotes(q);

    // Calculate basic stats
    const totalRevenue = quotes
        .filter((q: any) => q.status === 'ACCETTATO')
        .reduce((acc, q: any) => acc + Number(q.totalAmount), 0);
        
    const acceptedQuotes = quotes.filter((q: any) => q.status === 'ACCETTATO').length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'BOZZA' || q.status === 'INVIATO').length;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <FileText className="h-10 w-10 text-indigo-600" />
                        Preventivi
                    </h1>
                    <p className="text-slate-500 font-medium">Gestisci le offerte commerciali e monitora le conversioni.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <ProductManager />
                    <Button variant="outline" className="rounded-2xl border-slate-200 bg-white font-bold h-12 px-6 hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="mr-2 h-4 w-4" /> Esporta Report
                    </Button>
                    <CreateQuoteDialog />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                <Euro className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">INCASSATO</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Revenue Totale</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">€{totalRevenue.toLocaleString('it-IT')}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 group-hover:text-white" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Accettati</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{acceptedQuotes}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                                <Clock className="h-6 w-6 text-amber-600 group-hover:text-white" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">In Attesa</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingQuotes}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-600 text-white overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest">Conversione</p>
                            <h3 className="text-2xl font-black text-white mt-1">
                                {quotes.length > 0 ? ((acceptedQuotes / quotes.length) * 100).toFixed(1) : 0}%
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Section */}
            <Card className="rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl font-black text-slate-800">Elenco Preventivi</CardTitle>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <form className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    name="q"
                                    type="search"
                                    placeholder="Cerca cliente o numero..."
                                    className="pl-11 rounded-2xl border-slate-100 bg-slate-50/50 h-11 font-medium focus:ring-indigo-500 focus:bg-white transition-all w-full"
                                    defaultValue={q}
                                />
                            </form>
                            <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 text-slate-500 h-11 w-11">
                                <Filter className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-50">
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest pl-8 py-5">Numero</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest py-5">Cliente</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest py-5">Stato</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest py-5">Data</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest py-5">Metodo</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[11px] tracking-widest py-5">Totale</TableHead>
                                    <TableHead className="text-right pr-8 py-5 font-black text-slate-400 uppercase text-[11px] tracking-widest">Azioni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Nessun preventivo trovato</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotes.map((quote: any) => (
                                        <TableRow key={quote.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                                            <TableCell className="pl-8 py-6 font-mono font-black text-indigo-600 text-sm">
                                                #{quote.number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                                                        {quote.lead.firstName?.[0]}{quote.lead.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900">
                                                            {quote.lead.firstName} {quote.lead.lastName}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {quote.lead.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                                                    quote.status === 'BOZZA' && "bg-slate-100 text-slate-500",
                                                    quote.status === 'INVIATO' && "bg-blue-50 text-blue-600",
                                                    quote.status === 'ACCETTATO' && "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100",
                                                    quote.status === 'RIFIUTATO' && "bg-rose-50 text-rose-600"
                                                )}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-600 text-sm">
                                                {format(new Date(quote.createdAt), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="rounded-lg border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                                    {quote.paymentMethod || '-'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-black text-slate-900 text-base">
                                                €{Number(quote.totalAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex justify-end gap-2">
                                                    <QuoteRowActions quote={quote} />
                                                    <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-md transition-all">
                                                        <Link href={`/leads/${quote.leadId}`}>
                                                            <Eye className="h-5 w-5 text-slate-400" />
                                                        </Link>
                                                    </Button>
                                                    <QuoteBuilder
                                                        leadId={quote.leadId}
                                                        quoteId={quote.id}
                                                        existingQuote={quote}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { QuoteRowActions } from "@/components/quotes/quote-row-actions";
