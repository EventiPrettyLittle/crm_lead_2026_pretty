import { getLeadsByListType } from "@/actions/lead-lists";
import { LeadList } from "@/components/leads/lead-list";

export default async function ActivitiesPage() {
    const todayLeads = await getLeadsByListType('today');
    const expiredLeads = await getLeadsByListType('expired');
    const missedLeads = await getLeadsByListType('missed');
    const scheduledLeads = await getLeadsByListType('scheduled');
    const quoteFollowupLeads = await getLeadsByListType('quote-followup');

    return (
        <div className="space-y-6 container mx-auto py-6">
            <h2 className="text-3xl font-bold tracking-tight">Attività Quotidiane</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Priority 1: Expired & Today */}
                <div className="space-y-6">
                    <LeadList
                        title="⚠️ Follow-up Scaduti"
                        leads={expiredLeads}
                        emptyMessage="Ottimo lavoro! Nessuna attività scaduta."
                    />
                    <LeadList
                        title="📅 Da Contattare Oggi"
                        leads={todayLeads}
                        emptyMessage="Nessun contatto previsto per oggi."
                    />
                </div>

                {/* Priority 2: Missed & Quotes */}
                <div className="space-y-6">
                    <LeadList
                        title="📞 Non Risponde - Da Richiamare"
                        leads={missedLeads}
                        emptyMessage="Nessun richiamo in sospeso."
                    />
                    <LeadList
                        title="📄 Follow-up Preventivi"
                        leads={quoteFollowupLeads}
                        emptyMessage="Nessun preventivo da sollecitare."
                    />
                </div>
            </div>

            {/* Priority 3: Future */}
            <div className="pt-4">
                <LeadList
                    title="🗓️ Contatti Futuri Programmati"
                    leads={scheduledLeads}
                    emptyMessage="Nessun contatto futuro in programma."
                />
            </div>
        </div>
    );
}
