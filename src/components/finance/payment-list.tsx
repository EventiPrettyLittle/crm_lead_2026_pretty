'use client'

import { format } from "date-fns";
import { Euro, Banknote, CreditCard, Clock, MoreHorizontal, Trash2, ShieldCheck, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePayment } from "@/actions/finance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PaymentList({ payments, quoteId }: { payments: any[], quoteId: string }) {
    async function handleDelete(id: string) {
        if (!confirm("Sei sicuro di voler eliminare questa registrazione di pagamento?")) return;
        try {
            await deletePayment(id, quoteId);
            toast.success("Pagamento eliminato");
        } catch (e) {
            toast.error("Errore durante l'eliminazione");
        }
    }

    if (!payments || payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-100">
                <Clock className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">In attesa del primo versamento...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {payments.map((payment) => (
                <div key={payment.id} className="p-5 bg-white rounded-3xl border border-slate-50 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                            payment.method === 'CONTANTI' ? "bg-emerald-50 text-emerald-600" :
                            payment.method === 'BONIFICO' ? "bg-indigo-50 text-indigo-600" :
                            "bg-slate-50 text-slate-600"
                        )}>
                            {payment.method === 'CONTANTI' ? <Banknote className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 italic tracking-tight">€{Number(payment.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{payment.method}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(payment.date), 'dd MMMM yyyy, HH:mm')}
                                {payment.notes && <span className="mx-2 opacity-30">•</span>}
                                {payment.notes && <span className="italic">"{payment.notes}"</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(payment.id)}
                            className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
