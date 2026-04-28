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
        // Reindirizzamento automatico al login invece della schermata statica
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Reindirizzamento al Login...
                    </span>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
