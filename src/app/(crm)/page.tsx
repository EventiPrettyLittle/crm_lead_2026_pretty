export default function DashboardPage() {
  return (
    <div className="p-12 space-y-8 animate-in fade-in duration-1000">
      <div className="space-y-2">
        <h1 className="text-6xl font-black italic tracking-tighter text-slate-900 leading-none">
          CRM <br/><span className="text-indigo-600">RECOVERY MODE.</span>
        </h1>
        <p className="text-xl font-bold text-slate-400 italic">V.1.1.7 — Bypass Database Attivo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
        <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-4 shadow-2xl">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Accesso Diretto</h2>
          <p className="text-slate-400 text-sm font-bold">Il database sta avendo difficoltà tecniche. Questa modalità permette di vedere l'interfaccia senza bloccare il server.</p>
        </div>
        <div className="p-10 bg-white border border-slate-200 rounded-[3rem] space-y-4 shadow-xl">
           <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Database Status</h2>
           <div className="flex items-center gap-3">
             <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Neon Connection Unavailable</span>
           </div>
        </div>
      </div>
    </div>
  )
}
