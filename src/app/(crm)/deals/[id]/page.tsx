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
        select: { firstName: true, lastName: true, locationName: true }
    });

    if (!lead) return notFound();

    // Recuperiamo (o creiamo) il deal
    const dealData = await getDealById(id);
    const { acceptedQuote, ...initialDealData } = dealData;

    return (
        <div className="p-8 bg-slate-50/50 min-h-screen">
            <div className="max-w-5xl mx-auto mb-8">
                <Button variant="ghost" asChild className="rounded-xl font-bold text-slate-400 hover:text-indigo-600 mb-6 font-black italic uppercase text-[10px] tracking-widest">
                    <Link href="/deals">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Torna ai Deal
                    </Link>
                </Button>
            </div>
            
            <DealSheet 
                leadId={id} 
                initialData={initialDealData} 
                acceptedQuote={acceptedQuote}
                leadName={`${lead.firstName} ${lead.lastName}`} 
                leadLocation={lead.locationName || ''}
            />
        </div>
    );
}
