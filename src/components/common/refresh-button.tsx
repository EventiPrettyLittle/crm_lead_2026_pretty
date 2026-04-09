'use client'

import { Button } from "@/components/ui/button"
import { RotateCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function RefreshButton() {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const handleRefresh = () => {
        setIsRefreshing(true)
        router.refresh()
        
        // Simple visual feedback
        setTimeout(() => {
            setIsRefreshing(false)
            toast.success("Dati aggiornati")
        }, 1000)
    }

    return (
        <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="rounded-[1.5rem] h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest shadow-sm transition-all hover:scale-[1.02]"
            disabled={isRefreshing}
        >
            <RotateCw className={`mr-2 h-4 w-4 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </Button>
    )
}
