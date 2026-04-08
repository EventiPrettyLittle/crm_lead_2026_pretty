import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@prisma/client";
import { LeadCard } from "./lead-card";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    leads: Lead[];
}

export function KanbanColumn({ id, title, leads }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    const displayTitle = title.replace(/_/g, ' ');

    return (
        <div 
            ref={setNodeRef} 
            className={cn(
                "flex flex-col h-full min-w-[300px] w-[320px] rounded-3xl p-3 mr-4 transition-colors",
                isOver ? "bg-indigo-50/50 ring-2 ring-indigo-200" : "bg-slate-50/40"
            )}
        >
            <div className="flex items-center justify-between px-3 py-2 mb-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{displayTitle}</span>
                <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    {leads.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[500px] space-y-3 custom-scrollbar pr-1">
                <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    {leads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} />
                    ))}
                </SortableContext>
                
                {leads.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/30 italic">
                        Trascina qui
                    </div>
                )}
            </div>
        </div>
    );
}
