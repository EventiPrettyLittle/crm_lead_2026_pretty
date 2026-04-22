'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Phone, 
    Calendar, 
    UserX,
    Send,
    Loader2,
    MessageCircle,
    XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLeadQuickAction } from '@/actions/lead-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Lead } from '@prisma/client'

interface QuickActionsProps {
    lead: Lead;
    showLabels?: boolean;
}

export function QuickActions({ lead, showLabels = false }: QuickActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<any>(null)
    const [notes, setNotes] = useState('')

    const handleAction = async (type: any, data: any = {}) => {
        setLoading(type)
        try {
            const result = await updateLeadQuickAction(lead.id, type, data)
            if (result.success) {
                toast.success('Stato aggiornato')
                router.refresh()
                setDialogOpen(false)
                setNotes('')
            }
        } catch (error) {
            toast.error('Errore imprevisto')
        } finally {
            setLoading(null)
        }
    }

    const openWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.phoneRaw) return;
        const phone = lead.phoneRaw.replace(/\D/g, '');
        const text = encodeURIComponent(`Ciao ${lead.firstName}, sono Luca di Pretty. Ti contatto in merito alla tua richiesta...`);
        window.open(`https://wa.me/${phone.startsWith('39') ? phone : '39' + phone}?text=${text}`, '_blank');
    }

    const actions = [
        {
            id: 'whatsapp',
            label: 'WHATSAPP',
            icon: MessageCircle,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            isExternal: true,
            onClick: openWhatsApp
        },
        {
            id: 'contacted',
            label: 'CONTATTATO',
            icon: Phone,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
        },
        {
            id: 'no-answer',
            label: 'NON RISPONDE',
            icon: UserX,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100'
        },
        {
            id: 'appointment',
            label: 'APPUNTAMENTO',
            icon: Calendar,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100'
        },
        {
            id: 'preventivo',
            label: 'PREVENTIVO',
            icon: Send,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            border: 'border-violet-100'
        },
        {
            id: 'cancelled',
            label: 'CANCELLATO',
            icon: XCircle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100'
        }
    ]

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {actions.map((action) => (
                <Button
                    key={action.id}
                    variant="outline"
                    size={showLabels ? "default" : "sm"}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (action.isExternal && action.onClick) {
                            action.onClick(e);
                        } else if (action.id === 'contacted' || action.id === 'no-answer' || action.id === 'cancelled') {
                            handleAction(action.id)
                        } else {
                            setActionType(action.id)
                            setDialogOpen(true)
                        }
                    }}
                    disabled={!!loading}
                    className={cn(
                        "transition-all h-9 rounded-xl border font-black text-[9px] uppercase tracking-wider flex items-center gap-2 px-4 shadow-none",
                        action.bg, action.color, action.border,
                        "hover:opacity-80 active:scale-95"
                    )}
                >
                    {loading === action.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <action.icon className="h-3.5 w-3.5" />
                    )}
                    {showLabels && <span>{action.label}</span>}
                </Button>
            ))}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-[2rem] p-8 bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Dettaglio Azione</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">Inserisci una nota per concludere l'operazione.</DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Textarea 
                            placeholder="Note..." 
                            className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50 font-bold text-sm"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} className="rounded-lg font-bold">Chiudi</Button>
                        <Button 
                            size="sm"
                            onClick={() => handleAction(actionType, { notes })}
                            className="rounded-lg bg-indigo-600 font-black uppercase px-6"
                        >
                            Salva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
