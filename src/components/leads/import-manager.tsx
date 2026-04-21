'use client'

import { useState } from 'react'
import { parseLeadsFile } from '@/lib/import-utils'
import { importLeadsAction } from '@/actions/leads'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileUp, CheckCircle, Loader2, Database, AlertCircle } from 'lucide-react'
import { GoogleSheetsSync } from '@/components/leads/google-sheets-sync'
import { cn } from "@/lib/utils"

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
            const res = await importLeadsAction(leads)
            setResult(res)
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'importazione')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-slate-900 rounded-[1.3rem] flex items-center justify-center text-white shadow-xl rotate-3">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black italic text-slate-900 uppercase tracking-tighter">Importazione Lead</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">V.1.1.5 - RECOVERY ENGINE</p>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden bg-white/40 backdrop-blur-md border border-white/20">
                <CardContent className="p-12">
                    {/* Native Button Navigation (Safe for Build) */}
                    <div className="grid w-full grid-cols-2 mb-12 bg-slate-100/50 p-1.5 rounded-[1.8rem] h-16 border border-slate-200/30">
                        <button
                            type="button"
                            onClick={() => setActiveTab('file')}
                            className={cn(
                                "rounded-[1.4rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all",
                                activeTab === 'file' ? "bg-white shadow-xl text-slate-900" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <FileUp className="w-4 h-4" />
                            Importa File (Excel/CSV)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('google')}
                            className={cn(
                                "rounded-[1.4rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all",
                                activeTab === 'google' ? "bg-white shadow-xl text-slate-900" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Database className="w-4 h-4" />
                            Google Sheets
                        </button>
                    </div>

                    {activeTab === 'file' ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-slate-900/5 rounded-[2rem] group-hover:bg-slate-900/[0.07] transition-colors pointer-events-none" />
                                    <div className="relative p-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-slate-400 transition-all cursor-pointer bg-white/30 backdrop-blur-sm">
                                        <input
                                            type="file"
                                            accept=".csv, .xlsx, .xls"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="h-20 w-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">
                                            {file ? file.name : "Scegli un database"}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Trascina Excel o CSV qui
                                        </p>
                                    </div>
                                </div>

                                {file && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">File Selezionato</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">{file.name}</p>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="text-emerald-900 hover:bg-emerald-100 rounded-xl font-black text-[10px] uppercase"
                                        >
                                            Pulisci
                                        </Button>
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    size="lg"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] h-20 font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                    disabled={!file || isUploading}
                                    onClick={handleUpload}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                            Importazione in corso...
                                        </>
                                    ) : (
                                        <>
                                            <Database className="mr-3 h-6 w-6" />
                                            Esegui Caricamento
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <GoogleSheetsSync />
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Importazione Completata</h4>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                                            {result.success} Successi
                                        </span>
                                        <span className="text-[10px] font-black uppercase bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
                                            {result.errors} Errori
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-8 bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center gap-6 animate-in shake duration-500">
                            <div className="h-16 w-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-rose-900 italic font-black">Attenzione</h4>
                                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-4 justify-center py-8">
                <div className="h-px bg-slate-200 flex-1" />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Antigravity Premium CRM</p>
                <div className="h-px bg-slate-200 flex-1" />
            </div>
        </div>
    )
}
