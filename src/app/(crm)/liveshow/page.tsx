import { getDeals } from "@/actions/deals";
import { DealsList } from "@/components/deals/deals-list";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function LiveShowPage() {
    const allDeals = await getDeals();
    
    // Filtriamo solo i deal che hanno deliveryType === 'LIVE SHOW' o isLiveShow === true
    const liveShowDeals = allDeals.filter((d: any) => {
        const dealData = d.deal || {};
        return dealData.deliveryType === 'LIVE SHOW' || dealData.isLiveShow === true;
    });

    return (
        <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Operativo Eventi</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Live Show Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Gestione in tempo reale degli eventi con postazione dal vivo.
                    </p>
                </div>
                
                <Button variant="outline" asChild className="rounded-2xl border-slate-200 hover:bg-white shadow-sm">
                    <Link href="/deals" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-bold text-xs uppercase">Torna ai Deal</span>
                    </Link>
                </Button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                {liveShowDeals.length > 0 ? (
                    <DealsList initialDeals={liveShowDeals} linkPrefix="/liveshow" />
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-slate-900 uppercase">Nessun Live Show attivo</h3>
                            <p className="text-slate-400 text-xs">Imposta "Live Show" come tipo di consegna in un Deal per vederlo qui.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
