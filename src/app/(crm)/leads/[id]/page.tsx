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
import { Mail, Phone, MapPin, Calendar, User, FileText, ArrowRight, ArrowLeft, MessageSquare, Users2 } from "lucide-react"
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
                                        <Badge className={cn(
                                            "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm transition-all",
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
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                            <Calendar className="h-3.5 w-3.5" />
                                                Creato il {formatITDateTime(lead.createdAt)}
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
                                <TabsTrigger value="details" className="rounded-lg px-6 font-bold">Dettagli</TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-lg px-6 flex items-center gap-2 tracking-tight font-bold">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" /> Chat WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="activities" className="rounded-lg px-6 font-bold">Timeline</TabsTrigger>
                                <TabsTrigger value="quotes" className="rounded-lg px-6 font-bold">Preventivi</TabsTrigger>
                                <TabsTrigger value="finance" className="rounded-lg px-6 flex items-center gap-2 font-bold">
                                    <ArrowRight className="h-4 w-4 text-indigo-500 rotate-[-45deg]" /> Pagamenti
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="finance" className="outline-none">
                                <LeadFinanceTab lead={lead as any} />
                            </TabsContent>

                            <TabsContent value="chat" className="pt-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                <LeadWhatsAppChat 
                                    leadId={lead.id} 
                                    leadName={`${lead.firstName} ${lead.lastName}`}
                                    phone={lead.phoneRaw}
                                />
                            </TabsContent>

                            <TabsContent value="details" className="space-y-6 pt-6 outline-none animate-in fade-in zoom-in-95 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <Card className="rounded-[2rem] border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contatti & Evento</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid gap-5 pt-6 p-6">
                                                <div className="flex items-center gap-4 group">
                                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Mail className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Email</p>
                                                        <p className="text-sm font-black text-slate-800">{lead.email || '-'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                            <Phone className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Telefono</p>
                                                            <p className="text-sm font-black text-slate-800">{lead.phoneRaw || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <LeadWhatsAppButtons phone={lead.phoneRaw} />
                                                </div>

                                                <Separator />

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo Evento</p>
                                                        <p className="text-sm font-black">{lead.eventType || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data Evento</p>
                                                        <p className="text-sm font-black">
                                                            {lead.eventDate ? formatITDate(lead.eventDate) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* PANNELLO REFERENTI - SEMPRE VISIBILE SOTTO I CONTATTI */}
                                        <LeadReferentsPanel 
                                            leadId={lead.id} 
                                            initialReferents={(lead as any).referents} 
                                        />
                                    </div>

                                    <Card className="rounded-[2.2rem] border-slate-200/60 shadow-sm overflow-hidden group hover:border-indigo-100 transition-all bg-white">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-rose-500" /> Location
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid gap-5 pt-6 p-6">
                                            <div>
                                                {lead.locationName && (
                                                    <div className="mb-4">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 leading-none">Nome Location</p>
                                                        <p className="text-xl font-black text-slate-900 leading-tight">{lead.locationName}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Indirizzo Formattato</p>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                                                        <span className="text-sm font-bold text-slate-600 leading-relaxed">{lead.eventLocation || '-'}</span>
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
                                        {lead.activities.length === 0 && <p className="text-sm text-slate-400 text-center uppercase font-black py-10">Nessuna attività registrata.</p>}
                                        {lead.activities.map((activity) => (
                                            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-black text-slate-800 text-xs uppercase tracking-tight">{activity.type}</div>
                                                        <time className="text-[10px] font-black text-indigo-500">
                                                        {formatITTime(activity.createdAt)}
                                                        </time>
                                                    </div>
                                                    <div className="text-slate-500 text-xs font-bold leading-relaxed">
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
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Preventivi Generati</h3>
                                        <QuoteBuilder leadId={lead.id} />
                                    </div>
                                    <div className="grid gap-4">
                                        {lead.quotes.map((quote) => (
                                            <Card key={quote.id} className="rounded-2xl border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <CardTitle className="text-base font-black">Preventivo #{quote.number}</CardTitle>
                                                                <Badge className="rounded-lg bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest border-none">
                                                                    {quote.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase italic">Creato il {formatITDate(quote.createdAt)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-slate-900 leading-none mb-2">€{Number(quote.totalAmount).toFixed(2)}</p>
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

                    <div className="lg:col-span-4 space-y-6">
                         <Card className="rounded-[2.2rem] border-slate-200/60 shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Stato Operativo</CardTitle>
                                <div className="mt-2">
                                    <Badge className={cn(
                                        "py-2 px-6 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border-none",
                                        lead.stage === 'NUOVO' && "bg-blue-600 text-white",
                                        lead.stage === 'CONTATTATO' && "bg-emerald-500 text-white",
                                        lead.stage === 'NON_RISPONDE' && "bg-rose-500 text-white",
                                        lead.stage === 'APPUNTAMENTO' && "bg-indigo-500 text-white animate-pulse",
                                        lead.stage === 'PREVENTIVO' && "bg-violet-600 text-white",
                                        lead.stage === 'CANCELLATO' && "bg-rose-600 text-white shadow-xl shadow-rose-200",
                                    )}>
                                        {lead.stage?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Prossimo Follow-up</p>
                                    <p className="text-base font-black text-amber-400">
                                        {lead.nextFollowupAt ? formatITDateTime(lead.nextFollowupAt) : 'Non programmato'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Ultimo Contatto</p>
                                    <p className="text-sm font-black text-indigo-100">
                                        {lead.contactedAt ? formatITDateTime(lead.contactedAt) : 'Mai contattato'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[9px] font-black opacity-40 uppercase mb-2 tracking-widest">Interesse Prodotto</p>
                                    <Badge className="bg-white/10 hover:bg-white/20 border-white/20 py-1.5 px-4 rounded-xl text-indigo-100 font-extrabold uppercase text-[9px] tracking-wider">
                                        {lead.productInterest || 'Nessuna preferenza'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.2rem] border-slate-200/60 shadow-sm overflow-hidden bg-white">
                            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> Note Interne
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 pb-6 p-6">
                                <LeadInternalNotes leadId={lead.id} currentNotes={lead.notesInternal} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
