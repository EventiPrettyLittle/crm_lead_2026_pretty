import { getLeadById } from "@/actions/lead-detail"
import { QuickActions } from "@/components/leads/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { Mail, Phone, MapPin, Calendar, User, FileText, ArrowRight, ArrowLeft, MessageSquare, ExternalLink } from "lucide-react"
import QuoteBuilder from "@/components/quotes/quote-builder"
import { LeadLocationActions } from "@/components/leads/lead-location-actions"
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog"
import { DeleteLeadButton } from "@/components/leads/delete-lead-button"
import { Button } from "@/components/ui/button"
import { LeadInternalNotes } from "@/components/leads/lead-internal-notes"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { LeadWhatsAppButtons } from "@/components/leads/lead-whatsapp-buttons"

interface PageProps {
    params: { id: string }
}

import { LeadWhatsAppChat } from "@/components/leads/lead-whatsapp-chat"

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;
    const lead = await getLeadById(params.id);

    if (!lead) {
        return <div>Lead not found</div>
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section Moderno */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden mb-8">
                <div className="px-8 lg:px-12 py-6 lg:py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-indigo-600 h-12 w-12 shrink-0">
                                    <Link href="/leads">
                                        <ArrowLeft className="h-6 w-6" />
                                    </Link>
                                </Button>

                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                                        {lead.firstName} {lead.lastName}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 transition-colors rounded-lg px-2.5">
                                            {lead.stage}
                                        </Badge>
                                        <Separator orientation="vertical" className="h-4" />
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Creato il {format(new Date(lead.createdAt), 'dd MMM yyyy')}
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
                        <div className="flex items-center gap-2 mb-4">
                            <QuickActions lead={lead as any} showLabels={true} />
                        </div>

                        {/* Main Info Tabs */}
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                                <TabsTrigger value="details" className="rounded-lg px-6">Dettagli</TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-lg px-6 flex items-center gap-2 tracking-tight font-bold">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    Chat WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="activities" className="rounded-lg px-6">Timeline</TabsTrigger>
                                <TabsTrigger value="quotes" className="rounded-lg px-6">Preventivi</TabsTrigger>
                            </TabsList>

                            <TabsContent value="chat" className="pt-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                <LeadWhatsAppChat 
                                    leadId={lead.id} 
                                    leadName={`${lead.firstName} ${lead.lastName}`}
                                    phone={lead.phoneRaw}
                                />
                            </TabsContent>

                            <TabsContent value="details" className="space-y-6 pt-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Contatti & Evento</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-5 pt-6">
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                    <p className="text-sm font-semibold">{lead.email || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                        <Phone className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Telefono</p>
                                                        <p className="text-sm font-semibold">{lead.phoneRaw || '-'}</p>
                                                    </div>
                                                </div>
                                                <LeadWhatsAppButtons phone={lead.phoneRaw} />
                                            </div>

                                            <Separator />

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo Evento</p>
                                                    <p className="text-sm font-semibold">{lead.eventType || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Data Evento</p>
                                                    <p className="text-sm font-semibold">
                                                        {lead.eventDate ? format(new Date(lead.eventDate), 'dd MMM yyyy') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden group hover:border-indigo-200 transition-all">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-rose-500" /> Location
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-5 pt-6">
                                            <div>
                                                {(lead as any).locationName && (
                                                    <div className="mb-3">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Nome Location</p>
                                                        <p className="text-xl font-black text-slate-900 leading-tight">{(lead as any).locationName}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Indirizzo Formattato</p>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-300 mt-0.5" />
                                                        <span className="text-sm font-medium text-slate-600 leading-relaxed">{lead.eventLocation || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {lead.eventLocation && <LeadLocationActions lead={lead as any} />}
                                        </CardContent>
                                    </Card>
                                </div>

                            </TabsContent>

                            <TabsContent value="activities" className="pt-6 outline-none">
                                <Card className="rounded-2xl border-slate-200/60 shadow-sm p-6">
                                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
                                        {lead.activities.length === 0 && <p className="text-sm text-slate-400 text-center">Nessuna attività registrata.</p>}
                                        {lead.activities.map((activity) => (
                                            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-bold text-slate-800 text-sm">{activity.type}</div>
                                                        <time className="text-[10px] font-bold text-indigo-500">
                                                            {format(new Date(activity.createdAt), 'dd MMM HH:mm')}
                                                        </time>
                                                    </div>
                                                    <div className="text-slate-500 text-sm leading-relaxed">
                                                        {activity.notes}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="quotes" className="pt-6 outline-none">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <h3 className="text-lg font-bold text-slate-800">Preventivi Generati</h3>
                                        <QuoteBuilder leadId={lead.id} />
                                    </div>
                                    <div className="grid gap-4">
                                        {lead.quotes.map((quote) => (
                                            <Card key={quote.id} className="rounded-2xl border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <CardTitle className="text-base font-bold">Preventivo #{quote.number}</CardTitle>
                                                                <Badge variant={quote.status === 'INVIATO' ? 'default' : 'secondary'} className="rounded-lg">
                                                                    {quote.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium italic">Creato il {format(new Date(quote.createdAt), 'dd MMM yyyy')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-slate-900">€{Number(quote.totalAmount).toFixed(2)}</p>
                                                            <QuoteBuilder leadId={lead.id} quoteId={quote.id} existingQuote={quote} />
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

                    <div className="lg:col-span-4 space-y-6">
                         <Card className="rounded-2xl border-slate-200/60 shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold opacity-70 uppercase tracking-[0.2em]">Stato Operativo</CardTitle>
                                <div className="mt-2">
                                    <Badge className={cn(
                                        "py-1.5 px-6 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm",
                                        lead.stage === 'NUOVO' && "bg-blue-500 text-white",
                                        lead.stage === 'CONTATTATO' && "bg-emerald-500 text-white",
                                        lead.stage === 'NON_RISPONDE' && "bg-amber-500 text-white",
                                        lead.stage === 'APPUNTAMENTO' && "bg-indigo-400 text-white animate-pulse",
                                        lead.stage === 'PERSO' && "bg-slate-500 text-white",
                                        lead.stage === 'GESTITO' && "bg-indigo-600 text-white",
                                    )}>
                                        {lead.stage}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold opacity-60 uppercase">Prossimo Follow-up</p>
                                    <p className="text-lg font-bold text-amber-400">
                                        {lead.nextFollowupAt ? format(new Date(lead.nextFollowupAt), 'dd MMM yyyy HH:mm') : 'Non programmato'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold opacity-60 uppercase">Ultimo Contatto</p>
                                    <p className="text-sm font-medium">
                                        {lead.contactedAt ? format(new Date(lead.contactedAt), 'dd MMM yyyy HH:mm') : 'Mai contattato'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-bold opacity-60 uppercase mb-2">Interesse Prodotto</p>
                                    <Badge className="bg-white/10 hover:bg-white/20 border-white/20 py-1.5 px-4 rounded-xl text-indigo-100 font-bold uppercase text-[10px]">
                                        {lead.productInterest || 'Nessuna preferenza'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>


                        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4">
                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> Note Interne
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 pb-6">
                                <LeadInternalNotes leadId={lead.id} currentNotes={lead.notesInternal} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
