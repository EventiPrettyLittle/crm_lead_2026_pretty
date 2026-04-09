import { getQuotes } from "@/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Search, FileText, Eye, MoreHorizontal, Filter, Download, Mail, IndianRupee, Euro, TrendingUp, Clock, CheckCircle2, User, Sparkles } from "lucide-react";
import QuoteBuilder from "@/components/quotes/quote-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateQuoteDialog } from "@/components/quotes/create-quote-dialog";
import { ProductManager } from "@/components/quotes/product-manager";
import { QuotePreviewDialog } from "@/components/quotes/quote-preview-dialog";
import { getProducts } from "@/actions/products";
import { QuoteRowActions } from "@/components/quotes/quote-row-actions";

export default async function QuotesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    const quotes = await getQuotes(q);
    const products = await getProducts() as any[];

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

            {/* Catalogo Prodotti Rapido */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Catalogo Rapido</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {products.map((p) => (
                        <Card key={p.id} className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all p-4 group">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">€{Number(p.price).toLocaleString('it-IT')}</p>
                                <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition-colors">{p.name}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            <Card className="rounded-[2.5rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Elenco Preventivi</CardTitle>
                        <form className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                name="q"
                                defaultValue={q}
                                placeholder="Cerca per cliente o numero..." 
                                className="pl-11 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                            />
                        </form>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 border-none hover:bg-slate-50/50">
                                <TableHead className="py-5 pl-8 font-bold text-slate-400 uppercase text-[11px] tracking-widest">Numero</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[11px] tracking-widest">Cliente</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[11px] tracking-widest">Status</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[11px] tracking-widest">Data</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[11px] tracking-widest text-right">Totale</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[11px] tracking-widest text-right pr-8">Azioni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-400 font-medium">
                                        Nessun preventivo trovato.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                quotes.map((quote: any) => (
                                    <TableRow key={quote.id} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <TableCell className="py-6 pl-8">
                                            <span className="font-black text-slate-900">#{quote.number}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{quote.lead?.firstName} {quote.lead?.lastName}</span>
                                                <span className="text-xs text-slate-400">{quote.lead?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                                                quote.status === 'BOZZA' && "bg-slate-100 text-slate-500",
                                                quote.status === 'INVIATO' && "bg-blue-50 text-blue-600",
                                                quote.status === 'ACCETTATO' && "bg-emerald-50 text-emerald-600",
                                                quote.status === 'RIFIUTATO' && "bg-rose-50 text-rose-600"
                                            )}>
                                                {quote.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-slate-600">{format(new Date(quote.createdAt), 'dd/MM/yyyy')}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-indigo-600 text-lg">
                                            €{Number(quote.totalAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2 items-center">
                                                <QuoteRowActions quote={quote} />
                                                
                                                {/* Download */}
                                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-md transition-all group/btn">
                                                    <Download className="h-5 w-5 text-slate-400 group-hover/btn:text-indigo-600" />
                                                </Button>

                                                {/* Anteprima (Pop-up) */}
                                                <QuotePreviewDialog quote={quote} />

                                                {/* Profilo Cliente (User) */}
                                                <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 hover:bg-white hover:shadow-md transition-all group/btn">
                                                    <Link href={`/leads/${quote.leadId}`}>
                                                        <User className="h-5 w-5 text-slate-400 group-hover/btn:text-indigo-600" />
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
                </CardContent>
            </Card>
        </div>
    );
}
