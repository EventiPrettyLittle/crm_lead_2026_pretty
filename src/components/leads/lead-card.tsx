'use client'

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Lead } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCardProps {
    lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className={cn(
                "mb-2 group relative",
                isDragging && "opacity-50 grayscale"
            )}
        >
            <Link href={`/leads/${lead.id}`}>
                <Card className={cn(
                    "cursor-pointer hover:border-indigo-400/50 transition-all border-slate-200/50 overflow-hidden",
                    "hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white/90 backdrop-blur-sm px-2.5 py-2"
                )}>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase shrink-0 border border-slate-200/50">
                                    {lead.firstName?.[0]}{lead.lastName?.[0]}
                                </div>
                                <span className="text-[11px] font-black text-slate-900 truncate tracking-tight uppercase">
                                    {lead.firstName} {lead.lastName}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap pl-7">
                            {lead.productInterest && (
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                                    {lead.productInterest}
                                </span>
                            )}
                            {lead.eventDate && (
                                <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-bold tracking-tighter shrink-0">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {format(new Date(lead.eventDate), "dd MMM")}
                                </span>
                            )}
                            {lead.eventCity && (
                                <span className="flex items-center gap-0.5 text-[9px] text-slate-300 font-bold tracking-tighter truncate max-w-[80px]">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {lead.eventCity}
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </Link>
        </div>
    );
}
