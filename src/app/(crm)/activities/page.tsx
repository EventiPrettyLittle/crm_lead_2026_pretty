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
            <h2 className="text-3xl font-bold tracking-tight">Daily Activities</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {/* Priority 1: Expired & Today */}
                <div className="space-y-6">
                    <LeadList
                        title="⚠️ Expired Follow-ups"
                        leads={expiredLeads}
                        emptyMessage="No expired tasks. Great job!"
                    />
                    <LeadList
                        title="📅 To Contact Today"
                        leads={todayLeads}
                        emptyMessage="Nothing scheduled for today."
                    />
                </div>

                {/* Priority 2: Missed & Quotes */}
                <div className="space-y-6">
                    <LeadList
                        title="📞 No Answer - Retry"
                        leads={missedLeads}
                        emptyMessage="No missed calls to return."
                    />
                    <LeadList
                        title="📄 Quote Follow-ups"
                        leads={quoteFollowupLeads}
                        emptyMessage="No pending quotes to follow up."
                    />
                </div>
            </div>

            {/* Priority 3: Future */}
            <div className="pt-4">
                <LeadList
                    title="🗓️ Scheduled Future Follow-ups"
                    leads={scheduledLeads}
                    emptyMessage="No future follow-ups scheduled."
                />
            </div>
        </div>
    );
}
