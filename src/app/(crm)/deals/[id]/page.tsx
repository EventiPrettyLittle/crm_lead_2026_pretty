import { getDealById } from "@/actions/deals";
import prisma from "@/lib/prisma";
import { DealSheet } from "@/components/deals/deal-sheet";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Recuperiamo il lead per avere il nome
    const lead = await prisma.lead.findUnique({
        where: { id },
        select: { firstName: true, lastName: true, locationName: true, eventDate: true }
    });

    if (!lead) return notFound();

    // Recuperiamo (o creiamo) il deal
    const dealData = await getDealById(id);
    const { acceptedQuote, ...initialDealData } = dealData;

    return (
        <div className="p-2 md:p-4 bg-slate-50/50 min-h-screen">
            <DealSheet 
                leadId={id} 
                initialData={initialDealData} 
                acceptedQuote={acceptedQuote}
                leadName={`${lead.firstName} ${lead.lastName}`} 
                leadLocation={lead.locationName || ''}
                eventDate={lead.eventDate}
            />
        </div>
    );
}
