import { getLeadById } from "@/actions/lead-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Phone, MapPin, Mail } from "lucide-react"
import Link from "next/link"
import { formatITDateTime } from "@/lib/utils"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function LeadDetailPage(props: PageProps) {
    const params = await props.params;
    const lead = await getLeadById(params.id);

    if (!lead) {
        return <div className="p-20 text-center font-black">CLIENTE NON TROVATO</div>
    }

    return (
        <div className="p-8 lg:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl h-12 w-12"><Link href="/leads"><ArrowLeft className="h-6 w-6" /></Link></Button>
                <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><User className="h-7 w-7" /></div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight">{lead.firstName} {lead.lastName}</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Stato: {lead.stage}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-xl font-black italic">Contatti Rapidi</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-emerald-500" />
                            <span className="font-bold text-lg">{lead.phoneRaw || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-indigo-500" />
                            <span className="font-bold">{lead.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-rose-500" />
                            <span className="font-bold text-slate-600">{lead.eventLocation || 'Nessun indirizzo'}</span>
                        </div>
                    </div>
                    <div className="pt-6 border-t">
                        <p className="text-xs text-slate-400 font-bold italic">Creato il: {formatITDateTime(new Date(lead.createdAt))}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-4">
                    <h2 className="text-xl font-black italic text-indigo-400">Nota Rapida</h2>
                    <p className="text-slate-300 leading-relaxed font-medium">
                        {lead.notesInternal || 'Nessuna nota interna presente per questo cliente.'}
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <p className="text-amber-800 text-sm font-bold">
                    ⚠️ Stai visualizzando la versione di emergenza della pagina cliente per garantire il funzionamento del sistema. 
                    I preventivi e le chat WhatsApp sono temporaneamente disattivati sotto questa visualizzazione.
                </p>
            </div>
        </div>
    )
}
