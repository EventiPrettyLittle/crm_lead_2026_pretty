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
            toast.error("Inserisci l'ID del foglio di calcolo.")
            return
        }

        setIsSyncing(true)
        setResult(null)
        setError(null)

        try {
            // Extract ID from URL if a full URL is provided
            let id = spreadsheetId
            if (spreadsheetId.includes('/d/')) {
                id = spreadsheetId.split('/d/')[1].split('/')[0]
            }

            const res = await syncLeadsFromGoogleSheet(id)
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
        <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Database className="w-5 h-5" />
                    Sincronizzazione Google Sheets
                </CardTitle>
                <CardDescription>
                    Inserisci l'ID o l'URL del tuo Google Sheet per importare o aggiornare i lead automaticamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="ID o URL del foglio di calcolo..."
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        className="bg-white border-blue-200 focus-visible:ring-blue-500"
                    />
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || !spreadsheetId}
                        className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sincronizzazione...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sincronizza Ora
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-[11px] text-blue-600/80 bg-blue-100/50 p-2 rounded border border-blue-100">
                    <strong>Tip:</strong> Assicurati che il foglio abbia le intestazioni corrette: <em>Colonna 1, Nome, Cognome, Email, Telefono, Codice Paese, ecc.</em> L'Email verrà usata come identificativo unico.
                </div>

                {result && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 font-bold">Sincronizzazione Completata</AlertTitle>
                        <AlertDescription className="text-green-700">
                            {result.message}
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Errore</AlertTitle>
                        <AlertDescription className="space-y-3">
                            <p>{error}</p>
                            {error.includes("not connected") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.location.href = '/api/auth/google/login'}
                                    className="bg-white text-destructive hover:bg-destructive/10"
                                >
                                    Collega Account Google
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}
