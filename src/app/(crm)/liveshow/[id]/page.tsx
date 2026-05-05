import { getDealWithGuests } from "@/actions/liveshow";
import { LiveShowSheet } from "@/components/deals/liveshow-sheet";
import { notFound } from "next/navigation";

export default async function LiveShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Recuperiamo il deal con gli invitati e i dettagli del lead
    const dealData = await getDealWithGuests(id);

    if (!dealData) return notFound();

    return (
        <div className="p-2 md:p-4 bg-slate-50/50 min-h-screen">
            <LiveShowSheet 
                initialDeal={dealData} 
            />
        </div>
    );
}
