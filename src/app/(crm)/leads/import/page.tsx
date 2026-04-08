'use client'

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
        <div className="container mx-auto py-10 max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-6 h-6" />
                        Import Leads
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="file" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="file" className="gap-2">
                                <Upload className="w-4 h-4" />
                                Importa File (Excel/CSV)
                            </TabsTrigger>
                            <TabsTrigger value="google" className="gap-2">
                                <Database className="w-4 h-4" />
                                Google Sheets
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="space-y-6">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                />
                                <div className="text-[11px] text-blue-600/80 bg-blue-100/50 p-2 rounded border border-blue-100">
                                    <strong>Tip:</strong> Assicurati che il foglio abbia le intestazioni corrette: <em>Colonna 1, Nome, Cognome, Email, Telefono, Codice Paese, Tipologia Evento, Invitati, Prodotto, Data Evento, Luogo Evento, Quando Vorresti Essere Contattato.</em> L'Email verrà usata come identificativo unico.
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Formati accettati: .csv, .xlsx, .xls
                                </p>
                            </div>

                            <div className="bg-muted p-4 rounded-md text-sm">
                                <h4 className="font-semibold mb-2">Colonne Richieste:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-xs">
                                    <li><strong>Colonna 1</strong> (Data Creazione)</li>
                                    <li>Codice Paese, Tipologia Evento, Invitati</li>
                                    <li>Prodotto, Data Evento, Luogo Evento</li>
                                    <li>Quando Vorresti Essere Contattato</li>
                                </ul>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || isUploading}
                                    className="w-full sm:w-auto"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="mr-2 h-4 w-4" />
                                            Inizia Importazione
                                        </>
                                    )}
                                </Button>
                            </div>

                            {result && (
                                <Alert className={result.errors > 0 ? "border-yellow-500" : "border-green-500"}>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Importazione Completata</AlertTitle>
                                    <AlertDescription>
                                        Importati/aggiornati con successo {result.success} lead.
                                        {result.errors > 0 && <span className="block text-red-500 font-semibold">{result.errors} errori verificatisi.</span>}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Errore</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="google" className="space-y-6">
                            <GoogleSheetsSync />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
