'use client'

import { useState } from 'react'
import { parseLeadsFile } from '@/lib/import-utils'
import { importLeadsAction } from '@/actions/leads'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileUp, CheckCircle, Loader2, Database, AlertCircle, Info, Sparkles, ArrowRight, Zap } from 'lucide-react'
import { GoogleSheetsSync } from '@/components/leads/google-sheets-sync'
import { cn } from "@/lib/utils"
import Link from 'next/link'

export function ImportManager() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'file' | 'google'>('file')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setIsUploading(true)
        setResult(null)
        setError(null)

        try {
            const leads = await parseLeadsFile(file)
            if (leads.length === 0) {
                throw new Error("Nessun lead valido trovato nel file. Verifica le intestazioni.")
            }
            const res = await importLeadsAction(leads)
            setResult(res)
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'importazione')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Arricchito */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Database Recovery Engine</span>
                </div>
                <h1 className="text-5xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">
                    Importazione <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Massiva</span>
                </h1>
                <p className="text-slate-400 font-bold max-w-lg mx-auto text-sm">
                    Espandi il tuo business in pochi secondi. Carica i tuoi lead da Excel, CSV o sincronizzali direttamente da Google Sheets.
                </p>
            </div>

            <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3.5rem] overflow-hidden bg-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <CardContent className="p-10 md:p-16 relative z-10">
                    
                    {/* Navigation Tabs Custom */}
                    <div className="flex bg-slate-50 p-1.5 rounded-[2rem] gap-1 mb-12 max-w-md mx-auto border border-slate-100 shadow-inner">
                        <button
                            onClick={() => setActiveTab('file')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-14 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all",
                                activeTab === 'file' ? "bg-white shadow-lg text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            <FileUp className="w-4 h-4" />
                            File Locale
                        </button>
                        <button
                            onClick={() => setActiveTab('google')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-14 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all",
                                activeTab === 'google' ? "bg-white shadow-lg text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            <Database className="w-4 h-4" />
                            Cloud Sheets
                        </button>
                    </div>

                    {activeTab === 'file' ? (
                        <div className="space-y-10 animate-in fade-in zoom-in-98 duration-500">
                            {/* Upload Zone */}
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                />
                                <div className={cn(
                                    "relative p-16 flex flex-col items-center justify-center border-3 border-dashed rounded-[3rem] transition-all duration-500",
                                    file 
                                        ? "bg-emerald-50/50 border-emerald-200" 
                                        : "bg-slate-50/50 border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/30"
                                )}>
                                    <div className={cn(
                                        "h-24 w-24 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-6",
                                        file ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200" : "bg-white text-slate-400 shadow-lg group-hover:text-indigo-600 group-hover:shadow-indigo-100"
                                    )}>
                                        {file ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                                        {file ? "File Pronto per l'Invio" : "Trascina il tuo Database"}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        {file ? file.name : "Supportati: .xlsx, .xls, .csv"}
                                    </p>
                                </div>
                            </div>

                            {/* Info Guide */}
                            {!file && (
                                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Info className="w-4 h-4 text-indigo-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Guida alle Colonne</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['Nome', 'Cognome', 'Email', 'Telefono', 'Tipologia Evento', 'Data Evento', 'Luogo Evento'].map((col) => (
                                            <div key={col} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{col}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 col-span-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                            <span className="text-[10px] font-bold text-indigo-400 italic uppercase">Email obbligatoria per aggiornamenti</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                size="lg"
                                className="w-full bg-slate-900 hover:bg-black text-white rounded-[2rem] h-24 font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 transition-all hover:translate-y-[-4px] active:translate-y-[0] disabled:opacity-50 text-lg sm:text-xl italic"
                                disabled={!file || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                                        Analisi database...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-4 h-8 w-8 fill-amber-400 text-amber-400" />
                                        Lancia Caricamento
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-98 duration-500">
                            <GoogleSheetsSync />
                        </div>
                    )}

                    {/* Result Messages */}
                    {result && (
                        <div className="mt-12 bg-emerald-500 text-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                                <Sparkles className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="h-24 w-24 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter">Database Aggiornato!</h4>
                                    <p className="text-emerald-50 font-bold uppercase text-xs tracking-widest opacity-80">
                                        Operazione completata con successo nel sistema Platinum.
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                        <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
                                            <span className="block text-[10px] uppercase font-black opacity-60">Successi</span>
                                            <span className="text-2xl font-black italic">{result.success}</span>
                                        </div>
                                        <div className="bg-rose-500/20 px-6 py-3 rounded-2xl border border-rose-500/20">
                                            <span className="block text-[10px] uppercase font-black opacity-60">Errori</span>
                                            <span className="text-2xl font-black italic">{result.errors}</span>
                                        </div>
                                    </div>
                                    <Button asChild variant="link" className="text-white p-0 h-auto font-black italic uppercase tracking-widest text-[10px] mt-4 hover:tracking-[0.2em] transition-all">
                                        <Link href="/leads" className="flex items-center gap-2">
                                            Vai alla pipeline <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-12 bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 animate-in shake duration-500">
                            <div className="h-20 w-20 bg-rose-100 rounded-[2rem] flex items-center justify-center text-rose-600 shadow-lg">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-rose-900 italic">Interruzione Analisi</h4>
                                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-[0.1em] mt-2 leading-relaxed bg-rose-100/50 px-4 py-2 rounded-xl border border-rose-100">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-center opacity-30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Antigravity Premium System • Enterprise Recovery</p>
            </div>
        </div>
    )
}
