import { getLeads } from "@/actions/leads";
import { LeadsTable } from "@/components/leads/leads-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { DeleteAllLeadsButton } from "@/components/leads/delete-all-leads-button";
import { RefreshButton } from "@/components/common/refresh-button";

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <div className="space-y-8 h-full px-4 pb-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[2.5rem] border border-white shadow-xl shadow-indigo-100/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
                
                <div className="relative z-10 space-y-2">
                    <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 leading-tight">
                        Pipeline Clienti
                    </h2>
                    <p className="text-slate-500 font-semibold text-sm max-w-md">
                        Gestisci, filtra e trasforma le richieste d'informazione in contratti chiusi.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <RefreshButton />
                        <div className="hidden lg:block">
                            <DeleteAllLeadsButton />
                        </div>
                    </div>
                    <Button variant="outline" asChild className="rounded-[1.5rem] h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest shadow-sm transition-all hover:scale-[1.02]">
                        <Link href="/leads/import">
                            <Upload className="mr-2 h-4 w-4 text-indigo-500" />
                            Importa DB
                        </Link>
                    </Button>
                    <AddLeadDialog />
                </div>
            </div>

            <LeadsTable leads={leads} />
        </div>
    );
}
