export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getLeadById } from "@/actions/lead-detail"
import { QuickActions } from "@/components/leads/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { formatITDate, formatITDateTime, formatITTime } from "@/lib/utils"
import { Mail, Phone, MapPin, Calendar, User, FileText, ArrowRight, ArrowLeft, MessageSquare, Users2, ShieldCheck, Maximize2, Navigation, Star } from "lucide-react"
import QuoteBuilder from "@/components/quotes/quote-builder"
import { QuotePreviewDialog } from "@/components/quotes/quote-preview-dialog"
import { QuoteRowActions } from "@/components/quotes/quote-row-actions"
import { LeadLocationActions } from "@/components/leads/lead-location-actions"
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog"
import { DeleteLeadButton } from "@/components/leads/delete-lead-button"
import { Button } from "@/components/ui/button"
import { LeadInternalNotes } from "@/components/leads/lead-internal-notes"
import { LeadFinanceTab } from "@/components/leads/lead-finance-tab"
import { LeadReferentsPanel } from "@/components/leads/lead-referents-panel"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { LeadWhatsAppButtons } from "@/components/leads/lead-whatsapp-buttons"
import { LeadWhatsAppChat } from "@/components/leads/lead-whatsapp-chat"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;
    const lead = await getLeadById(params.id);

    if (!lead) {
        return <div className="p-20 text-center font-black text-slate-400 uppercase italic tracking-widest">Lead not found</div>
    }

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header Section Moderno */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden mb-8">
                <div className="px-8 lg:px-12 py-6 lg:py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-indigo-600 h-14 w-14 shrink-0">
                                    <Link href="/leads">
                                        <ArrowLeft className="h-7 w-7" />
                                    </Link>
                                </Button>

                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                                    <User className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 leading-none">
                                        {lead.firstName} {lead.lastName}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge className={cn(
                                            "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-none shadow-sm transition-all",
                                            lead.stage === 'NUOVO' && "bg-blue-50 text-blue-600",
                                            lead.stage === 'CONTATTATO' && "bg-emerald-50 text-emerald-600",
                                            lead.stage === 'NON_RISPONDE' && "bg-rose-50 text-rose-600",
                                            lead.stage === 'APPUNTAMENTO' && "bg-indigo-50 text-indigo-600",
                                            lead.stage === 'PREVENTIVO' && "bg-violet-50 text-violet-600",
                                            lead.stage === 'CANCELLATO' && "bg-rose-600 text-white shadow-lg shadow-rose-100",
                                        )}>
                                            {lead.stage?.replace('_', ' ')}
                                        </Badge>
                                        <Separator orientation="vertical" className="h-4" />
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            <Calendar className="h-3.5 w-3.5" />
                                                Creato: {formatITDateTime(lead.createdAt)}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <EditLeadDialog lead={lead as any} />
                            <DeleteLeadButton leadId={lead.id} variant="destructive" size="icon" showText={false} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8 lg:px-12 py-4 space-y-4">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-8">
                        {/* QUICK ACTIONS ROW */}
                        <div className="flex items-center gap-2 mb-4 bg-white/50 p-2 rounded-2xl border border-slate-100 inline-flex shadow-sm">
                            <QuickActions lead={lead as any} showLabels={true} />
                        </div>

                        {/* Main Info Tabs */}
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.5rem] h-14">
                                <TabsTrigger value="details" className="rounded-xl px-8 font-black text-[11px] uppercase tracking-widest">Dettagli</TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-xl px-8 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="activities" className="rounded-xl px-8 font-black text-[11px] uppercase tracking-widest">Timeline</TabsTrigger>
                                <TabsTrigger value="quotes" className="rounded-xl px-8 font-black text-[11px] uppercase tracking-widest">Preventivi</TabsTrigger>
                                <TabsTrigger value="finance" className="rounded-xl px-8 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest">
                                     Pagamenti
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-8 pt-8 outline-none animate-in fade-in zoom-in-95 duration-500">
                                
                                {/* RIGA 1: CONTATTI E REFERENTI (BILANCIATI) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                    <Card className="rounded-[2.5rem] border-slate-200/60 shadow-sm overflow-hidden bg-white flex flex-col">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5 px-8">
                                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contatti & Evento</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-6 pt-8 p-8 flex-1">
                                            <div className="flex items-center gap-5 group">
                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Mail className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1.5">Email Ufficiale</p>
                                                    <p className="text-base font-black text-slate-900">{lead.email || '---'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                        <Phone className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1.5">Recapito Telefonico</p>
                                                        <p className="text-base font-black text-slate-900">{lead.phoneRaw || '---'}</p>
                                                    </div>
                                                </div>
                                                <LeadWhatsAppButtons phone={lead.phoneRaw} />
                                            </div>

                                            <Separator className="my-2" />

                                            <div className="grid grid-cols-2 gap-6 pb-2">
                                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tipo Evento</p>
                                                    <p className="text-lg font-black text-slate-900">{lead.eventType || '-'}</p>
                                                </div>
                                                <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Data Evento</p>
                                                    <p className="text-lg font-black text-indigo-600">
                                                        {lead.eventDate ? formatITDate(lead.eventDate) : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <LeadReferentsPanel 
                                        leadId={lead.id} 
                                        initialReferents={(lead as any).referents} 
                                    />
                                </div>

                                {/* RIGA 2: LOCATION WIDE (MAPPA + INFO) */}
                                <Card className="rounded-[3rem] border-slate-200/60 shadow-2xl overflow-hidden bg-white">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-10">
                                        <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <MapPin className="h-5 w-5 text-rose-500" /> Analisi Geografica Location
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* MAPPA (GRANDE) */}
                                            <div className="lg:w-[60%] border-r border-slate-100 relative bg-slate-50 p-8">
                                                <div className="h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative group">
                                                    <LeadLocationActions lead={lead as any} />
                                                    
                                                    {/* Overlays Mappa */}
                                                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
                                                        <div className="bg-indigo-600/95 backdrop-blur-md text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
                                                            <Navigation className="h-4 w-4 animate-pulse" />
                                                            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Hub Logistico Premium</span>
                                                        </div>
                                                        <div className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-100">
                                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Dati Certificati</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* BARRA INDIRIZZO SOTTO MAPPA */}
                                                <div className="mt-6 bg-slate-950 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between text-white shadow-2xl gap-4">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                                            <MapPin className="h-6 w-6 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Destinazione Ufficiale</p>
                                                            <p className="text-sm font-bold text-indigo-50 leading-tight">{lead.eventLocation || 'Indirizzo non specificato'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <Button variant="ghost" size="sm" className="h-11 rounded-2xl font-black text-white hover:bg-white/10 flex items-center gap-2 px-5 text-[10px] uppercase">
                                                            <Maximize2 className="h-4 w-4" /> Massimizza
                                                        </Button>
                                                        <Button className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-[10px] px-8 uppercase shadow-lg shadow-indigo-900/50">
                                                            Percorso...
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* INFO VALORI (DESTRA) */}
                                            <div className="lg:w-[40%] bg-slate-50/30 p-10 flex flex-col justify-between">
                                                <div className="space-y-8">
                                                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Location Selezionata</p>
                                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none truncate">{lead.locationName || 'Nessuna Location'}</h2>
                                                    </div>
                                                    
                                                    <div className="space-y-5">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Riferimenti Territoriali</p>
                                                        <div className="grid gap-4">
                                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:translate-x-2 transition-all cursor-default">
                                                                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                                    <MapPin className="h-7 w-7" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Città</p>
                                                                    <p className="text-xl font-black text-slate-900 leading-none">{lead.eventCity || '---'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:translate-x-2 transition-all cursor-default">
                                                                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                                    <FileText className="h-7 w-7" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Provincia</p>
                                                                    <p className="text-xl font-black text-slate-900 leading-none">{lead.eventProvince || '---'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center gap-6 group hover:translate-x-2 transition-all cursor-default">
                                                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                                    <ShieldCheck className="h-7 w-7" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Regione</p>
                                                                    <p className="text-xl font-black text-slate-900 leading-none">{lead.eventRegion || '---'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">PrettyCRM Infrastructure v3.0</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="chat" className="pt-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                <LeadWhatsAppChat 
                                    leadId={lead.id} 
                                    leadName={`${lead.firstName} ${lead.lastName}`}
                                    phone={lead.phoneRaw}
                                />
                            </TabsContent>

                            <TabsContent value="activities" className="pt-6 outline-none">
                                <Card className="rounded-[2.5rem] border-slate-200/60 shadow-sm p-10 bg-white">
                                    <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-slate-50">
                                        {lead.activities.length === 0 && <p className="text-sm text-slate-400 text-center uppercase font-black py-20">Nessuna attività registrata.</p>}
                                        {lead.activities.map((activity) => (
                                            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-white bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                                <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:border-indigo-100 hover:shadow-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-black text-slate-900 text-xs uppercase tracking-widest">{activity.type}</div>
                                                        <time className="text-[11px] font-black text-indigo-500">
                                                        {formatITTime(activity.createdAt)}
                                                        </time>
                                                    </div>
                                                    <div className="text-slate-500 text-sm font-bold leading-relaxed">
                                                        {activity.notes}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="quotes" className="pt-6 outline-none">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-4">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Preventivi Emessi</h3>
                                        <QuoteBuilder leadId={lead.id} />
                                    </div>
                                    <div className="grid gap-5">
                                        {lead.quotes.map((quote) => (
                                            <Card key={quote.id} className="rounded-[2.5rem] border-slate-200/60 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                                <CardContent className="p-8">
                                                    <div className="flex justify-between items-center">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-4">
                                                                <CardTitle className="text-lg font-black text-slate-900">Preventivo #{quote.number}</CardTitle>
                                                                <Badge className="rounded-xl bg-slate-900 text-white font-black text-[10px] px-4 py-1.5 uppercase tracking-widest">
                                                                    {quote.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest italic">Edito il {formatITDate(quote.createdAt)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black text-slate-950 leading-none mb-3">€{Number(quote.totalAmount).toFixed(2)}</p>
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <QuoteRowActions quote={quote} />
                                                                </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                         <Card className="rounded-[3rem] border-slate-200/60 shadow-2xl overflow-hidden bg-slate-950 text-white border-none p-1">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.8rem] p-8">
                                <CardHeader className="p-0 pb-6">
                                    <CardTitle className="text-[11px] font-black opacity-50 uppercase tracking-[0.3em] mb-4">Pipeline Status</CardTitle>
                                    <div className="mt-2">
                                        <Badge className={cn(
                                            "py-2.5 px-8 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl border-none",
                                            lead.stage === 'NUOVO' && "bg-blue-600 text-white",
                                            lead.stage === 'CONTATTATO' && "bg-emerald-500 text-white",
                                            lead.stage === 'NON_RISPONDE' && "bg-rose-500 text-white",
                                            lead.stage === 'APPUNTAMENTO' && "bg-amber-400 text-slate-900 animate-pulse",
                                            lead.stage === 'PREVENTIVO' && "bg-violet-600 text-white",
                                            lead.stage === 'CANCELLATO' && "bg-slate-700 text-white",
                                        )}>
                                            {lead.stage?.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Prossimo Step</p>
                                        <p className="text-lg font-black text-amber-300">
                                            {lead.nextFollowupAt ? formatITDateTime(lead.nextFollowupAt) : 'Non pianificato'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">Ultima Interazione</p>
                                        <p className="text-base font-black text-indigo-100">
                                            {lead.contactedAt ? formatITDateTime(lead.contactedAt) : 'Mai contattato'}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-white/10">
                                        <p className="text-[9px] font-black opacity-30 uppercase mb-3 tracking-[0.2em]">Rating Interesse</p>
                                        <Badge className="bg-white/10 hover:bg-white/20 border-white/20 py-2 px-6 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest">
                                            {lead.productInterest || 'Base'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>

                        <Card className="rounded-[3rem] border-slate-200/60 shadow-xl overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-6 px-10">
                                <CardTitle className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-indigo-500" /> Note Interne
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <LeadInternalNotes leadId={lead.id} currentNotes={lead.notesInternal} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
