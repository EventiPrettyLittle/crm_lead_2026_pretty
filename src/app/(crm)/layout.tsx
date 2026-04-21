import { headers } from "next/headers"
import { getCurrentUser } from "@/actions/auth"

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  try {
    // Gatekeeper molto leggero
    await getCurrentUser();
    
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Header Ultra Light e Sicuro */}
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">P</div>
            <span className="font-black tracking-tighter text-slate-900">PLATINUM CRM</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Safe Mode Active
          </div>
        </header>

        <main className="p-6 md:p-10">
          {children}
        </main>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <h1 className="text-4xl font-black uppercase text-rose-500 mb-4">Errore di Sistema</h1>
        <p className="text-slate-400 mb-8 max-w-md">{error.message || "Eccezione rilevata durante il caricamento dei componenti."}</p>
        <a href="." className="px-8 h-14 bg-white text-black rounded-2xl font-black uppercase flex items-center">Ricarica</a>
      </div>
    )
  }
}
