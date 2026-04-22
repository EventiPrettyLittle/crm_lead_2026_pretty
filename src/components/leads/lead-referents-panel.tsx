'use client'

import { useState } from 'react'
import { Plus, Trash2, Users2, UserPlus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateLeadDetails } from '@/actions/lead-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Referent {
    role: string;
    name: string;
}

interface LeadReferentsPanelProps {
    leadId: string;
    initialReferents: string | null;
}

export function LeadReferentsPanel({ leadId, initialReferents }: LeadReferentsPanelProps) {
    const router = useRouter()
    const [referents, setReferents] = useState<Referent[]>(() => {
        try {
            return initialReferents ? JSON.parse(initialReferents) : []
        } catch (e) {
            return []
        }
    })

    // Sincronizzazione fondamentale: quando le props cambiano (es. dopo router.refresh), aggiorna lo stato locale
    useEffect(() => {
        try {
            if (initialReferents) {
                setReferents(JSON.parse(initialReferents))
            }
        } catch (e) {}
    }, [initialReferents])

    const [isAdding, setIsAdding] = useState(false)
    const [newRole, setNewRole] = useState('')
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)

    async function saveReferents(updatedList: Referent[]) {
        setLoading(true)
        try {
            const result = await updateLeadDetails(leadId, {
                referents: JSON.stringify(updatedList)
            })
            if (result.success) {
                setReferents(updatedList)
                toast.success('Referente aggiornato')
                router.refresh()
            }
        } catch (e) {
            toast.error('Errore nel salvataggio')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        if (!newName) return
        const newList = [...referents, { role: newRole, name: newName }]
        saveReferents(newList)
        setNewRole('')
        setNewName('')
        setIsAdding(false)
    }

    const handleRemove = (index: number) => {
        const newList = referents.filter((_, i) => i !== index)
        saveReferents(newList)
    }

    return (
        <Card className="rounded-[2rem] border-slate-200/60 shadow-sm overflow-hidden bg-white mt-6">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users2 className="h-3.5 w-3.5 text-indigo-500" /> Referenti (Parenti/Amici)
                </CardTitle>
                {!isAdding && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsAdding(true)}
                        className="h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[9px] hover:bg-indigo-600 hover:text-white transition-all px-3"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1" /> AGGIUNGI
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {referents.length === 0 && !isAdding && (
                    <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Nessun referente</p>
                    </div>
                )}

                {isAdding && (
                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                            <Input 
                                placeholder="Ruolo (es. Mamma)" 
                                className="h-9 rounded-xl border-white bg-white text-xs font-bold"
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                            />
                            <Input 
                                placeholder="Nome" 
                                className="h-9 rounded-xl border-white bg-white text-xs font-bold"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleAdd} disabled={loading} className="flex-1 h-8 rounded-xl bg-indigo-600 text-[10px] font-black uppercase">
                                <Check className="h-3.5 w-3.5 mr-1" /> Conferma
                             </Button>
                             <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-8 rounded-xl text-slate-400 text-[10px] font-black uppercase">
                                <X className="h-3.5 w-3.5" />
                             </Button>
                        </div>
                    </div>
                )}

                <div className="grid gap-3">
                    {referents.map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between group bg-slate-50/50 hover:bg-white p-3 rounded-2xl border border-slate-100/50 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 font-black text-[10px]">
                                    {ref.role?.[0] || 'R'}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{ref.role || 'Referente'}</p>
                                    <p className="text-sm font-black text-slate-800 leading-none">{ref.name}</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemove(idx)}
                                className="h-8 w-8 rounded-xl text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
