'use client'

import { useState } from "react"
import { Send, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { addLeadNoteAction } from "@/actions/add-lead-note"
import { toast } from "sonner"

interface LeadInternalNotesProps {
    leadId: string
    currentNotes: string | null
}

export function LeadInternalNotes({ leadId, currentNotes }: LeadInternalNotesProps) {
    const router = useRouter()
    const [newNote, setNewNote] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAddNote = async () => {
        if (!newNote.trim()) return

        setLoading(true)
        try {
            const res = await addLeadNoteAction(leadId, newNote)
            if (res.success) {
                setNewNote("")
                toast.success("Nota aggiunta!")
                router.refresh()
            } else {
                toast.error(res.error || "Errore")
            }
        } catch (err) {
            toast.error("Errore imprevisto")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-5 relative overflow-hidden shadow-inner">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium relative z-10 whitespace-pre-wrap">
                        {currentNotes || "Nessuna nota interna presente."}
                    </p>
                </div>
                <FileText className="absolute top-2 right-2 h-16 w-16 text-amber-200/20 rotate-12 -z-0" />
            </div>

            <div className="relative group">
                <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Scrivi qui un aggiornamento (es: 'Richiamato, appuntamento fissato')"
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-12 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm min-h-[80px]"
                />
                <Button 
                    size="icon" 
                    onClick={handleAddNote}
                    disabled={loading || !newNote.trim()}
                    className="absolute right-3 bottom-3 h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all shrink-0"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
            
            <div className="px-2">
                <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-none">
                    Tutt i messaggi verranno firmati come LUCA V.
                </p>
            </div>
        </div>
    )
}
