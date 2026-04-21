'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { parseLeadsFile, ParsedLead } from '@/lib/import-utils'
import { importLeadsAction } from '@/actions/leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Upload, FileUp, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleSheetsSync } from '@/components/leads/google-sheets-sync'

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setResult(null);
        setError(null);

        try {
            const parsedData = await parseLeadsFile(file);
            if (parsedData.length === 0) {
                setError("Nessun lead valido trovato nel file (verifica la colonna 'Email').");
                setIsUploading(false);
                return;
            }
            const res = await importLeadsAction(parsedData);
            setResult({ success: res.success, errors: res.errors });
        } catch (err: any) {
            console.error(err);
            setError("Failed to process file: " + (err.message || 'Unknown error'));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-16 px-4">
            <div className="container mx-auto max-w-[900px]">
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="pt-12 px-12 pb-0">
                        <div className="flex items-center gap-4 mb-2">
                           <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                <Upload className="w-6 h-6" />
                           </div>
                           <div>
                                <CardTitle className="text-3xl font-black italic tracking-tight text-slate-900 uppercase">
                                    Import Leads
                                </CardTitle>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestione flussi dati esterni</p>
                           </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-12">
                        <Tabs defaultValue="file" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-12 bg-slate-100/50 p-1.5 rounded-[1.8rem] h-16">
                                <TabsTrigger value="file" className="rounded-[1.4rem] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2">
                                    <FileUp className="w-4 h-4" />
                                    Importa File (Excel/CSV)
                                </TabsTrigger>
                                <TabsTrigger value="google" className="rounded-[1.4rem] data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2">
                                    <Database className="w-4 h-4" />
                                    Google Sheets
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="file" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-slate-900/5 rounded-[2rem] group-hover:bg-slate-900/[0.07] transition-colors pointer-events-none" />
                                        <div className="relative p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-slate-400 transition-all cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".csv, .xlsx, .xls"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <div className="h-16 w-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4">
                                                <Upload className="w-7 h-7 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                {file ? file.name : "Scegli file o trascinalo qui"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">.csv, .xlsx, .xls supportati</p>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4">
                                        <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">💡 Pro Tip per l'importazione</p>
                                            <p className="text-[11px] leading-relaxed text-indigo-700/80 font-medium italic">
                                                Assicurati che il foglio abbia le intestazioni corrette: Colonna 1, Nome, Cognome, Email, Telefono, Codice Paese, ecc. L'Email verrà usata come identificativo unico per evitare duplicati.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full" /> 
                                            Colonne Richieste
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                            {[
                                                "Colonna 1 (Data Creazione)",
                                                "Codice Paese",
                                                "Tipologia Evento",
                                                "Numero Invitati",
                                                "Prodotto Interesse",
                                                "Data Evento",
                                                "Luogo Evento",
                                                "Preferenza Contatto"
                                            ].map((col, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <CheckCircle className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{col}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!file || isUploading}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] h-16 font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                                Processing Data...
                                            </>
                                        ) : (
                                            <>
                                                <FileUp className="mr-3 h-5 w-5" />
                                                Inizia Importazione
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="google" className="animate-in fade-in zoom-in-95 duration-300">
                                <GoogleSheetsSync />
                            </TabsContent>
                        </Tabs>

                        {(result || error) && (
                            <div className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                                {result && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4">
                                        <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Importazione Completata</p>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
                                                {result.success} Lead gestiti con successo
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-4">
                                        <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Errore durante l'import</p>
                                            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-0.5">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
