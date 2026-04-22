'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Phone, 
    MessageSquare, 
    Calendar, 
    CheckCircle2, 
    XCircle, 
    Clock, 
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
import { Input } from '@/components/ui/input'
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
                toast.success('Stato aggiornato istantaneamente')
                router.refresh()
                setDialogOpen(false)
                setNotes('')
            } else {
                toast.error('Errore nell\'aggiornamento')
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
            hover: 'hover:bg-emerald-600',
            textColor: 'text-emerald-600'
        },
        {
            id: 'no-answer',
            label: 'Non Risponde',
            icon: UserX,
            color: 'bg-rose-500',
            hover: 'hover:bg-rose-600',
            textColor: 'text-rose-600'
        },
        {
            id: 'appointment',
            label: 'Appuntamento',
            icon: Calendar,
            color: 'bg-indigo-500',
            hover: 'hover:bg-indigo-600',
            textColor: 'text-indigo-600'
        },
        {
            id: 'preventivo',
            label: 'Preventivo',
            icon: Send,
            color: 'bg-violet-500',
            hover: 'hover:bg-violet-600',
            textColor: 'text-violet-600'
        }
    ]

    return (
        <div className="flex items-center gap-2">
            {actions.map((action) => (
                <Button
                    key={action.id}
                    onClick={() => {
                        if (action.id === 'contacted' || action.id === 'no-answer') {
                            handleAction(action.id) // ISTANTANEO PER QUESTI STATI
                        } else {
                            setActionType(action.id)
                            setDialogOpen(true)
                        }
                    }}
                    disabled={!!loading}
                    className={cn(
                        "rounded-xl font-black text-[10px] uppercase tracking-widest h-12 transition-all flex items-center gap-2 px-4 shadow-sm",
                        loading === action.id ? "bg-slate-100" : cn(action.color, "text-white")
                    )}
                >
                    {loading === action.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                        <action.icon className="h-4 w-4" />
                    )}
                    {showLabels && <span>{action.label}</span>}
                </Button>
            ))}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-10 bg-white border-slate-100 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                            Registra {actionType === 'appointment' ? 'Appuntamento' : 'Azione'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-slate-400">Aggiungi un dettaglio per aggiornare la timeline del cliente.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Textarea 
                            placeholder="Scrivi qui eventuali note..." 
                            className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 font-bold"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => setDialogOpen(false)}
                            className="rounded-xl font-bold text-slate-400"
                        >
                            Annulla
                        </Button>
                        <Button 
                            onClick={() => handleAction(actionType, { notes })}
                            disabled={!!loading}
                            className="rounded-xl bg-indigo-600 font-black uppercase px-8 h-12 shadow-lg shadow-indigo-100"
                        >
                            {loading ? 'Aggiornamento...' : 'Conferma e Salva'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
