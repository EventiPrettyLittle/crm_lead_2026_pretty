'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Phone, 
    Calendar, 
    UserX,
    Send,
    Loader2
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

    const actions = [
        {
            id: 'contacted',
            label: 'Contattato',
            icon: Phone,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500',
            lightColor: 'bg-emerald-50'
        },
        {
            id: 'no-answer',
            label: 'Non Risponde',
            icon: UserX,
            color: 'bg-rose-500',
            textColor: 'text-rose-500',
            lightColor: 'bg-rose-50'
        },
        {
            id: 'appointment',
            label: 'Appuntamento',
            icon: Calendar,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500',
            lightColor: 'bg-indigo-50'
        },
        {
            id: 'preventivo',
            label: 'Preventivo',
            icon: Send,
            color: 'bg-violet-500',
            textColor: 'text-violet-500',
            lightColor: 'bg-violet-50'
        }
    ]

    return (
        <div className={cn("flex items-center", showLabels ? "gap-2" : "gap-1")}>
            {actions.map((action) => (
                <Button
                    key={action.id}
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (action.id === 'contacted' || action.id === 'no-answer') {
                            handleAction(action.id)
                        } else {
                            setActionType(action.id)
                            setDialogOpen(true)
                        }
                    }}
                    disabled={!!loading}
                    className={cn(
                        "transition-all duration-200",
                        showLabels 
                            ? cn("h-12 px-6 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2", action.color)
                            : cn("h-9 w-9 rounded-full h-8 w-8", action.lightColor, action.textColor, "hover:bg-indigo-600 hover:text-white shadow-sm")
                    )}
                >
                    {loading === action.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <action.icon className={cn(showLabels ? "h-4 w-4" : "h-3.5 w-3.5")} />
                    )}
                    {showLabels && <span>{action.label}</span>}
                </Button>
            ))}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-10 bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Regista Azione</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">Aggiungi un dettaglio per aggiornare la timeline.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Scrivi qui eventuali note..." 
                            className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 font-bold"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold">Annulla</Button>
                        <Button 
                            onClick={() => handleAction(actionType, { notes })}
                            className="rounded-xl bg-indigo-600 font-black uppercase px-8 h-12 shadow-lg"
                        >
                            Conferma e Salva
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
