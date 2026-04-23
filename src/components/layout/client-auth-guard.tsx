'use client'

import { useEffect, useState } from "react"
import { ShieldCheck, Loader2 } from "lucide-react"

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
    const [isVerified, setIsVerified] = useState<boolean | null>(null)

    useEffect(() => {
        // Verifica se esiste il segnale di presenza (PLATINUM_ACTIVE)
        // Questo cookie è appositamente NON httpOnly così lo scudo può vederlo
        const hasActiveSession = document.cookie.includes('PLATINUM_ACTIVE=true');
        
        if (hasActiveSession) {
            setIsVerified(true)
        } else {
            setIsVerified(false)
        }
    }, [])

    if (isVerified === null) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (isVerified === false) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 p-12 text-center space-y-8 border border-slate-100">
                    <div className="h-24 w-24 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-100">
                        <ShieldCheck className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Accesso Negato</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Identità non verificata o sessione scaduta</p>
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        Per accedere ai dati sensibili del CRM è necessario autenticarsi. 
                    </p>
                    <a 
                        href="/login" 
                        className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Vai al Login
                    </a>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
