import { getLeadById } from "@/actions/lead-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Phone, MapPin, Mail, FileText } from "lucide-react"
import Link from "next/link"
import { formatITDateTime } from "@/lib/utils"
import { QuickActions } from "@/components/leads/quick-actions"
import { LeadInternalNotes } from "@/components/leads/lead-internal-notes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;
    const lead = await getLeadById(params.id);

    if (!lead) {
        return <div className="p-20 text-center font-black uppercase">Cliente non trovato</div>
    }

    return (
        <div className="p-8 lg:p-12 space-y-8 animate-in fade-in duration-500">
            {/* Header con Azioni Rapide */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-xl h-12 w-12"><Link href="/leads"><ArrowLeft className="h-6 w-6" /></Link></Button>
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><User className="h-7 w-7" /></div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{lead.firstName} {lead.lastName}</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Stato attuale: {lead.stage}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <QuickActions lead={lead as any} showLabels={true} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Colonna Sinistra: Dati e Note */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-black italic">Contatti & Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-emerald-500" />
                                    <span className="font-bold text-lg">{lead.phoneRaw || '-'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-indigo-500" />
                                    <span className="font-bold">{lead.email || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-rose-500 mt-1" />
                                <span className="font-bold text-slate-600 leading-relaxed">{lead.eventLocation || 'Nessun indirizzo impostato'}</span>
                            </div>
                        </div>
                    </div>

                    {/* TIMELINE ATTIVITÀ (Nuova!) */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-black italic">Timeline Attività</h2>
                        <div className="space-y-4">
                            {lead.activities.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">Nessuna attività registrata ancora.</p>
                            ) : (
                                lead.activities.map((activity: any) => (
                                    <div key={activity.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-black">{activity.type}</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{activity.notes}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{formatITDateTime(new Date(activity.createdAt))}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Colonna Destra: Note Interne */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-8">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-500" /> Note Interne
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <LeadInternalNotes leadId={lead.id} currentNotes={lead.notesInternal} />
                        </CardContent>
                    </Card>

                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                        <p className="text-amber-800 text-[11px] font-bold leading-tight">
                            ⚠️ MODALITÀ DI RIPRISTINO ATTIVA: <br />
                            I preventivi e le chat WhatsApp sono ancora in fase di test di stabilità.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
