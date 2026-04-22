import { getDeals } from "@/actions/deals";
import { DealsList } from "@/components/deals/deals-list";

export default async function DealsPage() {
    const deals = await getDeals();

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700 bg-slate-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Produzione & Logistica</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">
                        Gestione <span className="text-indigo-600">Deal</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-lg">Monitora l'andamento delle schede tecniche e la preparazione degli eventi.</p>
                </div>

                {/* Counter Badge */}
                <div className="bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-w-[140px] animate-in slide-in-from-right duration-700">
                    <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Totale Eventi</span>
                    <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                        {deals.length}
                    </span>
                </div>
            </div>

            {/* List with Filters Component */}
            <DealsList initialDeals={deals} />
        </div>
    );
}
