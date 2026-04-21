import { getLeadById } from "@/actions/lead-detail"
import { QuickActions } from "@/components/leads/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatITDate, formatITDateTime, formatITTime } from "@/lib/utils"
import { Mail, Phone, MapPin, Calendar, User, FileText, ArrowRight, ArrowLeft, MessageSquare } from "lucide-react"
import QuoteBuilder from "@/components/quotes/quote-builder"
import { QuoteRowActions } from "@/components/quotes/quote-row-actions"
import { LeadLocationActions } from "@/components/leads/lead-location-actions"
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog"
import { DeleteLeadButton } from "@/components/leads/delete-lead-button"
import { Button } from "@/components/ui/button"
import { LeadInternalNotes } from "@/components/leads/lead-internal-notes"
import { LeadFinanceTab } from "@/components/leads/lead-finance-tab"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LeadWhatsAppButtons } from "@/components/leads/lead-whatsapp-buttons"
import { LeadWhatsAppChat } from "@/components/leads/lead-whatsapp-chat"

// FIX NEXT.JS 15: params deve essere una Promise
interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;
    const lead = await getLeadById(params.id);

    if (!lead) {
        return <div className="p-20 text-center font-black text-slate-400 uppercase">Lead not found</div>
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden mb-8">
                <div className="px-8 lg:px-12 py-6 lg:py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                             <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" asChild className="rounded-xl h-12 w-12 shrink-0">
                                    <Link href="/leads"><ArrowLeft className="h-6 w-6" /></Link>
                                </Button>
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                                        {lead.firstName} {lead.lastName}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase">{lead.stage}</Badge>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium italic">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Creato il {formatITDateTime(new Date(lead.createdAt))}
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

                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                                <TabsTrigger value="details" className="rounded-lg px-6">Dettagli</TabsTrigger>
                                <TabsTrigger value="chat" className="rounded-lg px-6 flex items-center gap-2 tracking-tight font-bold">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="quotes" className="rounded-lg px-6">Preventivi</TabsTrigger>
                                <TabsTrigger value="finance" className="rounded-lg px-6">Pagamenti</TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden p-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Contatti</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Mail className="h-5 w-5" /></div>
                                                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Email</p><p className="font-bold">{lead.email || '-'}</p></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Phone className="h-5 w-5" /></div>
                                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Telefono</p><p className="font-bold">{lead.phoneRaw || '-'}</p></div>
                                                </div>
                                                <LeadWhatsAppButtons phone={lead.phoneRaw} />
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden p-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Evento</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600"><MapPin className="h-5 w-5" /></div>
                                                <p className="font-bold text-slate-600 leading-relaxed">{lead.eventLocation || '-'}</p>
                                            </div>
                                            {lead.eventLocation && <LeadLocationActions lead={lead as any} />}
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="finance"><LeadFinanceTab lead={lead as any} /></TabsContent>
                            <TabsContent value="chat"><LeadWhatsAppChat leadId={lead.id} leadName={`${lead.firstName} ${lead.lastName}`} phone={lead.phoneRaw} /></TabsContent>
                            <TabsContent value="quotes" className="space-y-4 pt-6">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-lg font-black italic">Preventivi Generati</h3>
                                    <QuoteBuilder leadId={lead.id} />
                                </div>
                                {lead.quotes.map((quote: any) => (
                                    <Card key={quote.id} className="p-6 rounded-2xl border-slate-200 shadow-sm flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="font-black">Preventivo #{quote.number}</p>
                                            <p className="text-xs text-slate-400 italic">{formatITDate(new Date(quote.createdAt))}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-2xl font-black text-indigo-600">€{Number(quote.totalAmount).toFixed(2)}</p>
                                            <QuoteRowActions quote={quote} />
                                        </div>
                                    </Card>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
