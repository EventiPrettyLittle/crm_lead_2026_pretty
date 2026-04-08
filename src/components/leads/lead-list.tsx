'use client'

import { Lead } from "@prisma/client"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Calendar, Phone, Mail } from "lucide-react"

interface LeadListProps {
    title: string;
    leads: Lead[];
    emptyMessage?: string;
    badgeColor?: string;
}

export function LeadList({ title, leads, emptyMessage = "No leads found.", badgeColor = "bg-primary" }: LeadListProps) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center text-lg">
                    {title}
                    <Badge variant="secondary" className="ml-2">{leads.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
                ) : (
                    leads.map((lead) => (
                        <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
                            <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                    {lead.firstName} {lead.lastName}
                                    {lead.productInterest && <Badge variant="outline" className="text-[10px] h-5">{lead.productInterest}</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
                                    {lead.phoneRaw && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phoneRaw}</span>}
                                    {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                                </div>
                                {lead.nextFollowupAt && (
                                    <div className="text-xs font-medium text-orange-600 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Due: {format(new Date(lead.nextFollowupAt), 'dd/MM/yyyy HH:mm')}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                                    <Link href={`/leads/${lead.id}`}>
                                        <ArrowRight className="h-4 w-4" />
                                        <span className="sr-only">View</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
