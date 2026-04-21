'use client'

import { useState } from 'react'
import { syncLeadsFromGoogleSheet } from '@/actions/leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react'
import { toast } from 'sonner'

export function GoogleSheetsSync() {
    const [spreadsheetId, setSpreadsheetId] = useState('')
    const [isSyncing, setIsSyncing] = useState(false)
    const [result, setResult] = useState<{ success: number; errors: number; message?: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSync = async () => {
        if (!spreadsheetId) {
            toast.error("Inserisci l'ID o l'URL del foglio di calcolo.")
            return
        }

        setIsSyncing(true)
        setResult(null)
        setError(null)

        try {
            const res = await syncLeadsFromGoogleSheet(spreadsheetId)
            if (res.errors > 0 && res.success === 0) {
                setError(res.message || "Errore durante la sincronizzazione.")
            } else {
                setResult(res)
                toast.success("Sincronizzazione completata!")
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Errore imprevisto.")
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-6">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 border-dashed">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Sincronizzazione Diretta</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Importa dal cloud in tempo reale</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="relative group">
                            <Input
                                placeholder="Incolla qui l'ID o l'URL del Google Sheet..."
                                value={spreadsheetId}
                                onChange={(e) => setSpreadsheetId(e.target.value)}
                                className="bg-white border-slate-200 focus-visible:ring-slate-900 h-16 rounded-[1.3rem] px-6 text-sm font-medium shadow-sm transition-all"
                            />
                        </div>
                        
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing || !spreadsheetId}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.3rem] h-16 font-black uppercase tracking-[0.15em] shadow-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    Sincronizzazione in corso...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-3 h-5 w-5" />
                                    Sincronizza Foglio
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4">
                    <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Configurazione Richiesta</p>
                        <p className="text-[11px] leading-relaxed text-indigo-700/80 font-medium italic">
                            Verifica che il foglio sia condiviso con il tuo account e che le intestazioni siano corrette. La sincronizzazione non sovrascrive i lead esistenti (usa l'Email come chiave).
                        </p>
                    </div>
                </div>

                {result && (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Sync Completata con Successo</p>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                                {result.success} Lead aggiornati correttamente
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-[1.8rem] overflow-hidden">
                        <div className="p-6 flex items-start gap-4">
                            <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black text-rose-900 uppercase tracking-tight mb-2">Attenzione: Problema di Connessione</p>
                                <p className="text-[11px] text-rose-700 leading-relaxed font-medium italic mb-4">{error}</p>
                                
                                {(error.includes("collegato") || error.includes("connected")) && (
                                    <Button
                                        onClick={() => window.location.href = '/api/auth/google/login'}
                                        className="h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-6"
                                    >
                                        Riconnetti Account Google
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
