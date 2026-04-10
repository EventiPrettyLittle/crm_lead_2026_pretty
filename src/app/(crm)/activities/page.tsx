import { getLeadsByListType } from "@/actions/lead-lists";
import { LeadList } from "@/components/leads/lead-list";
import { getCalendarEvents } from "@/actions/calendar";
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, FileText, UserCheck, PhoneMissed, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import { it } from "date-fns/locale";

export default async function ActivitiesPage() {
    // Lead categories
    const contactedLeads = await getLeadsByListType('contacted');
    const nonRispondeLeads = await getLeadsByListType('missed');
    const pendingQuoteLeads = await getLeadsByListType('pending-quotes');
    
    // Calendar events
    const calendarData = await getCalendarEvents();
    const todayEvents = calendarData.events?.filter(event => {
        const start = new Date(event.start);
        return isToday(start);
    }) || [];

    const totalUrgent = nonRispondeLeads.length + pendingQuoteLeads.length;

    return (
        <div className="space-y-8 container mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-slate-50/50 min-h-screen">
            {/* Operational Summary Header */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 italic">Dashboard Attività</h2>
                    <p className="text-slate-400 font-medium capitalize">
                        {format(new Date(), "EEEE d MMMM", { locale: it })} • {todayEvents.length} Appuntamenti oggi
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-orange-50 px-6 py-4 rounded-3xl border border-orange-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <PhoneMissed className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Da Richiamare</p>
                            <p className="text-2xl font-black text-orange-600">{nonRispondeLeads.length}</p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 px-6 py-4 rounded-3xl border border-indigo-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <FileText className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">In Attesa</p>
                            <p className="text-2xl font-black text-indigo-600">{pendingQuoteLeads.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Section 1: Contattati & Non Risponde */}
                <div className="space-y-8">
                    <LeadList
                        title="👥 Lista di Contattati"
                        leads={contactedLeads}
                        emptyMessage="Nessun cliente contattato di recente."
                    />
                    <LeadList
                        title="📞 Follow-up: Non Risponde"
                        leads={nonRispondeLeads}
                        emptyMessage="Ottimo! Tutti hanno risposto o sono stati richiamati."
                    />
                </div>

                {/* Section 2: Preventivi & Calendario */}
                <div className="space-y-8">
                    <LeadList
                        title="📄 Preventivi in Sospeso"
                        leads={pendingQuoteLeads}
                        emptyMessage="Tutti i preventivi sono stati gestiti."
                    />
                    
                    {/* Today's Appointments Widget */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-indigo-400">
                                <span className="flex items-center gap-2 italic">🗓️ Eventi della Giornata</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] text-white">{todayEvents.length}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {todayEvents.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 font-bold uppercase text-xs">
                                    Nessun appuntamento per oggi
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {todayEvents.map((event: any) => (
                                        <div key={event.id} className="p-5 hover:bg-white/5 transition-all flex gap-4">
                                            <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/5 pr-4">
                                                <span className="text-lg font-black text-indigo-400">{format(new Date(event.start), 'HH:mm')}</span>
                                                <Clock className="h-3 w-3 text-slate-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-white text-base">{event.title}</h4>
                                                <p className="text-slate-400 text-xs font-medium mt-0.5">{event.location || 'Sede / Remoto'}</p>
                                                {event.calendarName && (
                                                    <span className="inline-block mt-2 text-[8px] font-black uppercase bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                                        {event.calendarName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* Success Tip Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                             <CheckCircle2 size={100} />
                        </div>
                        <h4 className="text-xl font-bold mb-3 italic">Tip del Giorno</h4>
                        <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                            I preventivi hanno il 40% in più di probabilità di essere accettati se seguiti entro le prime 48 ore. 
                            Controlla la lista "In Sospeso" regolarmente!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
