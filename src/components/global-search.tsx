'use client'

import { useState, useEffect, useRef } from "react"
import { Search, User, Phone, X, Loader2, ArrowRight } from "lucide-react"
import { searchLeadsGlobal } from "@/actions/search-leads"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GlobalSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([])
                setIsOpen(false)
                return
            }

            setLoading(true)
            const res = await searchLeadsGlobal(query)
            setResults(res)
            setIsOpen(true)
            setLoading(false)
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (id: string) => {
        setIsOpen(false)
        setQuery("")
        router.push(`/leads/${id}`)
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-xl mx-auto group">
            <div className="relative">
                <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                    query ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-400"
                )} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ricerca rapida lead (Nome, Cognome, Cell...)"
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-12 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading && <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />}
                    {query && !loading && (
                        <button 
                            onClick={() => setQuery("")}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Risultati Suggeriti ({results.length})</p>
                    </div>
                    
                    {results.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase italic">Nessun lead trovato</p>
                            <p className="text-[10px] text-slate-300 mt-1">Provato con nome differente o nuovo numero?</p>
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                            {results.map((lead) => (
                                <button
                                    key={lead.id}
                                    onClick={() => handleSelect(lead.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/50 transition-all group/item text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all shadow-sm">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-800 leading-none">
                                                {lead.firstName} {lead.lastName}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover/item:text-indigo-400 transition-colors">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phoneRaw || 'Nessun cell'}
                                                </div>
                                                <Badge className="bg-slate-100 text-slate-500 group-hover/item:bg-white group-hover/item:text-indigo-600 border-none px-1.5 py-0 text-[8px] font-black uppercase">
                                                    {lead.stage}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-2 p-2 pt-1 border-t border-slate-50 w-full">
                        <Link href="/leads" onClick={() => setIsOpen(false)} className="block w-full text-center py-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                             Vedi Tutti i Lead
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
}

function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", className)}>
            {children}
        </span>
    )
}
