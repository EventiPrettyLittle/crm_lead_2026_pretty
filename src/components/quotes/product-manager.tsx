'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Sparkles, X, Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getProducts, createProduct, deleteProduct, updateProduct } from '@/actions/products'
import { initDatabase } from '@/actions/db-init'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ProductManager() {
    const [open, setOpen] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    // Form state for creating/editing
    const [editingId, setEditingId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')

    useEffect(() => {
        if (open) {
            fetchProducts();
        }
    }, [open])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const res = await getProducts()
            setProducts(res as any[])
        } catch (error) {
            toast.error("Errore nel caricamento prodotti")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!name || !price) {
            toast.error("Nome e prezzo sono obbligatori");
            return;
        }
        
        const numericPrice = Number(price);
        if (isNaN(numericPrice)) {
            toast.error("Il prezzo deve essere un numero valido");
            return;
        }

        setSubmitting(true)
        try {
            if (editingId) {
                await updateProduct(editingId, {
                    name,
                    price: numericPrice
                })
                toast.success("Prodotto aggiornato");
            } else {
                await createProduct({ 
                    name, 
                    price: numericPrice,
                    category: "DEFAULT"
                })
                toast.success("Prodotto aggiunto al catalogo");
            }
            resetForm();
            fetchProducts();
        } catch (error: any) {
            console.error("Product action error:", error);
            toast.error(`Errore nel salvataggio: ${error.message || "Verifica che il database sia aggiornato"}`);
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setName('')
        setPrice('')
        setEditingId(null)
    }

    const startEdit = (p: any) => {
        setEditingId(p.id)
        setName(p.name)
        setPrice(p.price.toString())
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Rimuovere questo prodotto dal catalogo?")) return
        try {
            await deleteProduct(id)
            toast.success("Prodotto rimosso")
            fetchProducts()
        } catch (error) {
            toast.error("Errore nella rimozione")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-2xl border-slate-200 bg-white font-bold h-12 px-6 hover:bg-slate-50 transition-all shadow-sm">
                    <Sparkles className="mr-2 h-4 w-4 text-indigo-500" /> Catalogo Prodotti
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white relative">
                    <Sparkles className="absolute top-4 right-6 h-24 w-24 opacity-10" />
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-3xl font-black tracking-tight mb-2">Catalogo Prodotti</DialogTitle>
                            <p className="text-indigo-100 font-medium opacity-90">
                                Gestisci i prodotti predefiniti per aggiungerli velocemente ai preventivi.
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                                const res = await initDatabase();
                                if (res.success) toast.success("Database sincronizzato!");
                                else toast.error("Errore sincronizzazione: " + res.error);
                            }}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-[9px] uppercase tracking-widest h-8 px-3 rounded-full"
                        >
                            Sincronizza Database
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Add/Edit Product Form */}
                    <div className={cn(
                        "p-6 rounded-3xl space-y-4 shadow-inner transition-colors",
                        editingId ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"
                    )}>
                        <div className="flex justify-between items-center">
                            <Label className={cn(
                                "text-[10px] font-black uppercase tracking-widest ml-1",
                                editingId ? "text-amber-500" : "text-slate-400"
                            )}>
                                {editingId ? "Modifica Prodotto" : "Nuovo Prodotto"}
                            </Label>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={resetForm} className="h-6 text-[10px] font-bold text-amber-600">
                                    Annulla
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input 
                                placeholder="Nome prodotto/servizio..." 
                                className="rounded-xl h-11 border-white bg-white font-bold col-span-2"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Input 
                                type="number" 
                                placeholder="Prezzo (€)" 
                                className="rounded-xl h-11 border-white bg-white font-bold"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <Button 
                                onClick={handleSubmit} 
                                disabled={submitting || !name || !price}
                                className={cn(
                                    "rounded-xl h-11 font-black text-[10px] uppercase tracking-widest",
                                    editingId ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                                )}
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    <>{editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />} {editingId ? "Salva" : "Aggiungi"}</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300">
                                <Sparkles className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest font-black">Nessun prodotto in catalogo</p>
                            </div>
                        ) : (
                            products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-all shadow-sm group">
                                    <div className="flex-1">
                                        <p className="font-black text-slate-900">{product.name}</p>
                                        <p className="text-indigo-600 font-black text-sm">€{Number(product.price).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => startEdit(product)}
                                            className="rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 h-10 w-10 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(product.id)}
                                            className="rounded-xl text-rose-400 hover:bg-rose-50 h-10 w-10 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
