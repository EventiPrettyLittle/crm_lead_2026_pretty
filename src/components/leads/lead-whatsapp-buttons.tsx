'use client'

import { Button } from "@/components/ui/button"
import { MessageSquare, ExternalLink } from "lucide-react"

interface LeadWhatsAppButtonsProps {
    phone?: string | null
}

export function LeadWhatsAppButtons({ phone }: LeadWhatsAppButtonsProps) {
    if (!phone) return null;

    const cleanPhone = phone.replace(/\D/g, "");

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-emerald-100 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                title="WhatsApp CRM Hub"
                onClick={() => window.open(`/whatsapp?phone=${cleanPhone}`, "_self")}
            >
                <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg border-slate-100 text-slate-500 hover:bg-slate-50 shadow-sm"
                title="WhatsApp Web Diretto"
                onClick={() => window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}`, "_blank")}
            >
                <ExternalLink className="h-4 w-4" />
            </Button>
        </div>
    );
}
