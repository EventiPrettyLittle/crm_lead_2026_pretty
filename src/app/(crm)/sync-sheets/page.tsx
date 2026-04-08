'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Database, RefreshCcw, ExternalLink, CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from "lucide-react"
import { syncLeadsFromGoogleSheet } from "@/actions/leads"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function SyncSheetsPage() {
    const [sheetUrl, setSheetUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [lastResult, setLastResult] = useState<{ success: number, errors: number, message?: string } | null>(null)

    const handleSync = async () => {
        if (!sheetUrl) {
            toast.error("Per favore, inserisci un link valido di Google Sheets")
            return
        }

        setIsLoading(true)
        setLastResult(null)

        try {
            // Pass the raw URL, the action will extract the ID
            const result = await syncLeadsFromGoogleSheet(sheetUrl)
            setLastResult(result)
            if (result.success > 0) {
                toast.success(`Sincronizzazione completata: ${result.success} lead importati`)
            } else if (result.errors > 0 || !result.success) {
                toast.error(result.message || "Errore durante la sincronizzazione")
            }
        } catch (error) {
            console.error("Sync error:", error)
            toast.error("Errore critico durante la sincronizzazione")
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnectGoogle = () => {
        window.location.href = '/api/auth/google/login'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/20">
                            <Database className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sync Google Sheets</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Importa i tuoi lead direttamente dai fogli di calcolo Google.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Main Action Area */}
                <div className="md:col-span-8 space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">Sorgente Dati</CardTitle>
                            <CardDescription>Incolla l'URL del tuo foglio Google qui sotto</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input 
                                        placeholder="https://docs.google.com/spreadsheets/d/..." 
                                        value={sheetUrl}
                                        onChange={(e) => setSheetUrl(e.target.value)}
                                        className="h-12 px-4 rounded-2xl border-slate-200 bg-white/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    />
                                </div>
                                <Button 
                                    onClick={handleSync} 
                                    disabled={isLoading || !sheetUrl}
                                    className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all gap-2"
                                >
                                    {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                    Sincronizza Ora
                                </Button>
                            </div>

                            {lastResult && (
                                <div className={`p-4 rounded-2xl border ${lastResult.success > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} transition-all`}>
                                    <div className="flex items-start gap-3">
                                        {lastResult.success > 0 ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                        )}
                                        <div>
                                            <p className={`font-bold ${lastResult.success > 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                                                {lastResult.success > 0 ? 'Sincronizzazione Riuscita' : 'Dettagli Importazione'}
                                            </p>
                                            <p className={`text-sm ${lastResult.success > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {lastResult.message || `Importati ${lastResult.success} lead, con ${lastResult.errors} errori.`}
                                            </p>
                                            
                                            <div className="flex gap-4 mt-3">
                                                <Badge variant="outline" className="bg-white/50 border-emerald-200 text-emerald-700 px-3 py-1 rounded-lg">
                                                    Successi: {lastResult.success}
                                                </Badge>
                                                <Badge variant="outline" className="bg-white/50 border-amber-200 text-amber-700 px-3 py-1 rounded-lg">
                                                    Errori: {lastResult.errors}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Auto-Sync Guide */}
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-sm border border-white/10">
                                    <RefreshCcw className="w-5 h-5 animate-pulse" />
                                </div>
                                <CardTitle className="text-xl font-black">Sincronizzazione Automatica ⚡️</CardTitle>
                            </div>
                            <CardDescription className="text-indigo-200 font-medium pt-2">
                                Vuoi che i lead appaiano istantaneamente nel CRM quando vengono aggiunti al foglio?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 text-sm">
                                <p className="font-semibold text-indigo-300 uppercase tracking-widest text-[10px]">Istruzioni Rapide:</p>
                                <ol className="list-decimal list-inside space-y-3 font-medium text-slate-300">
                                    <li>Nel tuo Foglio Google, vai su <span className="text-white font-bold">Estensioni &gt; Apps Script</span>.</li>
                                    <li>Incolla lo script che trovi qui sotto.</li>
                                    <li>Salva e aggiungi un <span className="text-white font-bold">Attivatore (Trigger)</span> per la funzione <code className="bg-white/10 px-2 py-0.5 rounded text-white">onEdit</code> o <code className="bg-white/10 px-2 py-0.5 rounded text-white">onFormSubmit</code>.</li>
                                </ol>
                                <div className="mt-6">
                                    <p className="font-black text-rose-400 mb-2 uppercase tracking-tighter text-xs">Webhook URL (da usare nello script):</p>
                                    <code className="block bg-black/40 p-3 rounded-xl border border-white/5 font-mono text-emerald-400 text-xs break-all">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/google-sheets` : 'https://tuo-dominio.com/api/webhooks/google-sheets'}
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Format Guide */}
                    <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-xl">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-indigo-500" />
                                <CardTitle className="text-lg font-bold text-slate-800">Guida alla Formattazione</CardTitle>
                            </div>
                            <CardDescription>Per una sincronizzazione perfetta, il tuo foglio dovrebbe avere queste colonne:</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { k: 'Email', r: true },
                                    { k: 'Nome', r: false },
                                    { k: 'Cognome', r: false },
                                    { k: 'Telefono', r: false },
                                    { k: 'Data Evento', r: false },
                                    { k: 'Luogo Evento', r: false },
                                    { k: 'Tipologia Evento', r: false },
                                    { k: 'Invitati', r: false },
                                ].map((col) => (
                                    <div key={col.k} className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                        <span className="text-sm font-semibold text-slate-700">{col.k}</span>
                                        {col.r && <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">REQ</span>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="border-none bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 p-2 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-20 transition-all duration-700">
                            <Database className="w-48 h-48" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl font-black">Pro Tip 🤵🚀</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-indigo-100 font-medium leading-relaxed">
                                Assicurati di aver condiviso il foglio con l'account Google che hai collegato al CRM, oppure che il foglio sia accessibile via link!
                            </p>
                            <Button variant="secondary" className="w-full rounded-2xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 gap-2 shadow-lg transition-all" onClick={() => window.open('https://docs.google.com/spreadsheets', '_blank')}>
                                Apri Fogli Google
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Status Collegamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
                                <span className="text-slate-700 font-bold uppercase text-[10px] tracking-widest">Google API Attivo</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Le tue credenziali OAuth sono valide, ma se hai problemi prova a ricollegare l'account.
                            </p>
                            <Button 
                                onClick={handleConnectGoogle}
                                variant="outline" 
                                className="w-full mt-4 rounded-xl border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all font-bold text-xs gap-2"
                            >
                                <RefreshCcw className="w-3.5 h-3.5 text-indigo-500" />
                                Ricollega Google
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
