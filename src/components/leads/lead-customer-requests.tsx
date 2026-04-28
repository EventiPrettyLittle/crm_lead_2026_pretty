'use client'

import { useState } from "react"
import { 
    Plus, 
    CheckCircle2, 
    Circle, 
    MoreVertical, 
    Pencil, 
    Trash2, 
    MessageSquare,
    ChevronRight,
    Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateLeadDetails } from "@/actions/lead-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomerRequest {
    id: string
    title: string
    notes: string
    completed: boolean
}

interface LeadCustomerRequestsProps {
    leadId: string
    initialRequests: string | null
}

export function LeadCustomerRequests({ leadId, initialRequests }: LeadCustomerRequestsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [requests, setRequests] = useState<CustomerRequest[]>(() => {
        if (!initialRequests) return []
        try {
            return JSON.parse(initialRequests)
        } catch (e) {
            console.error("Error parsing customer requests:", e)
            return []
        }
    })

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRequest, setEditingRequest] = useState<CustomerRequest | null>(null)
    const [formTitle, setFormTitle] = useState("")
    const [formNotes, setFormNotes] = useState("")

    const handleSaveRequests = async (updatedRequests: CustomerRequest[]) => {
        setLoading(true)
        try {
            const res = await updateLeadDetails(leadId, {
                customerRequests: JSON.stringify(updatedRequests)
            })
            if (res.success) {
                setRequests(updatedRequests)
                router.refresh()
                return true
            } else {
                toast.error(res.error || "Errore nel salvataggio")
                return false
            }
        } catch (err) {
            toast.error("Errore imprevisto")
            return false
        } finally {
            setLoading(false)
        }
    }

    const openAddDialog = () => {
        setEditingRequest(null)
        setFormTitle("")
        setFormNotes("")
        setIsDialogOpen(true)
    }

    const openEditDialog = (req: CustomerRequest) => {
        setEditingRequest(req)
        setFormTitle(req.title)
        setFormNotes(req.notes)
        setIsDialogOpen(true)
    }

    const handleFormSubmit = async () => {
        if (!formTitle.trim()) {
            toast.error("Il titolo è richiesto")
            return
        }

        let updatedRequests: CustomerRequest[]
        if (editingRequest) {
            updatedRequests = requests.map(r => 
                r.id === editingRequest.id 
                    ? { ...r, title: formTitle, notes: formNotes } 
                    : r
            )
        } else {
            const newRequest: CustomerRequest = {
                id: Math.random().toString(36).substring(7),
                title: formTitle,
                notes: formNotes,
                completed: false
            }
            updatedRequests = [...requests, newRequest]
        }

        const success = await handleSaveRequests(updatedRequests)
        if (success) {
            setIsDialogOpen(false)
            toast.success(editingRequest ? "Richiesta aggiornata" : "Richiesta aggiunta")
        }
    }

    const toggleCompleted = async (id: string) => {
        const updatedRequests = requests.map(r => 
            r.id === id ? { ...r, completed: !r.completed } : r
        )
        await handleSaveRequests(updatedRequests)
    }

    const deleteRequest = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa richiesta?")) return
        const updatedRequests = requests.filter(r => r.id !== id)
        const success = await handleSaveRequests(updatedRequests)
        if (success) toast.success("Richiesta eliminata")
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-indigo-500" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Task & Richieste
                    </h4>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={openAddDialog}
                    className="h-7 px-2 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase gap-1"
                >
                    <Plus className="h-3 w-3" /> Aggiungi
                </Button>
            </div>

            <div className="space-y-2">
                {requests.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nessuna richiesta annotata</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div 
                            key={req.id}
                            className={cn(
                                "group relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer",
                                req.completed 
                                    ? "bg-slate-50/50 border-slate-50 opacity-60" 
                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm"
                            )}
                        >
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleCompleted(req.id); }}
                                className="shrink-0"
                            >
                                <Checkbox 
                                    checked={req.completed} 
                                    className="h-5 w-5 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" 
                                />
                            </div>
                            
                            <div 
                                className="flex-1 min-w-0"
                                onClick={() => openEditDialog(req)}
                            >
                                <p className={cn(
                                    "text-xs font-black text-slate-800 truncate leading-none mb-1",
                                    req.completed && "line-through text-slate-400"
                                )}>
                                    {req.title}
                                </p>
                                {req.notes && (
                                    <p className="text-[10px] font-medium text-slate-400 truncate">
                                        {req.notes}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(req); }}
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); }}
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                        <DialogTitle className="text-xl font-black">
                            {editingRequest ? "Modifica Richiesta" : "Nuova Richiesta"}
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-[11px] font-medium opacity-80">
                            Annota le specifiche desiderate dal cliente per questo evento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Titolo Richiesta</label>
                            <Input 
                                placeholder="Esempio: Allestimento floreale extra..." 
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Note di Dettaglio</label>
                            <Textarea 
                                placeholder="Scrivi qui i dettagli tecnici o le note operative..." 
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50 font-medium text-sm focus:bg-white transition-all resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 flex items-center justify-between gap-4">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-slate-400">
                            Annulla
                        </Button>
                        <Button 
                            onClick={handleFormSubmit} 
                            disabled={loading}
                            className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-black px-8 h-11 text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingRequest ? "Aggiorna" : "Salva Richiesta")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
