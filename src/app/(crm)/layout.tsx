import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { NotificationCenter } from "@/components/layout/notification-center"
import { UserNav } from "@/components/layout/user-nav"
import { LiveClock } from "@/components/layout/live-clock"
import { ReminderNotifier } from "@/components/layout/reminder-notifier"
import { getCurrentUser } from "@/actions/auth"

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  try {
    // GATEKEEPER SERVER-SIDE (Blindato)
    await getCurrentUser();
    
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full bg-[#f8fafc] relative">
          <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300 px-6 h-20 flex items-center justify-between gap-8">
            <div className="flex items-center gap-4 shrink-0">
              <SidebarTrigger className="h-10 w-10 text-slate-500 hover:text-indigo-600 transition-colors" />
              <div className="h-8 w-px bg-slate-200" />
            </div>

            <div className="flex-1 max-w-2xl px-4 flex items-center gap-4">
              <GlobalSearch />
            </div>

            <div className="hidden md:flex items-center justify-center px-8 border-x border-slate-100 h-full">
              <LiveClock />
            </div>

            <div className="flex items-center gap-4 lg:min-w-[12rem] justify-end">
              <NotificationCenter />
              <UserNav />
            </div>
          </header>

          <div className="p-8 lg:p-10 transition-all duration-500">
            {children}
          </div>
        </main>
        <ReminderNotifier />
      </SidebarProvider>
    )
  } catch (error: any) {
    // ERROR DISPLAY (Safe for Server Component)
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="max-w-3xl w-full bg-black/40 backdrop-blur-3xl rounded-[3rem] p-12 border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
            <div className="h-3 w-3 bg-rose-500/50 rounded-full animate-pulse delay-150" />
            <div className="h-3 w-3 bg-rose-500/20 rounded-full animate-pulse delay-300" />
            <h1 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em] italic ml-2">Terminal Error Caught</h1>
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 leading-none">
            Eccezione Critica <br/><span className="text-rose-500 italic">Rilevata da Antigravity</span>
          </h2>

          <div className="bg-rose-500/5 rounded-3xl p-8 border border-rose-500/10 mb-8 font-mono">
            <p className="text-rose-400 text-xs uppercase font-bold tracking-widest mb-4 opacity-50">Dettaglio Tecnico Protegge:</p>
            <code className="text-rose-200 text-sm break-all leading-relaxed">
              {error.message || "Errore di connessione al database o variabili d'ambiente mancanti."}
            </code>
          </div>

          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] italic mb-8">
            Invia uno screenshot di questa pagina per permettermi di risolvere il problema immediatamente.
          </p>

          <a 
            href="." 
            className="inline-flex items-center justify-center h-16 px-10 bg-white text-slate-900 rounded-[1.3rem] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            Ripristina Connessione
          </a>
        </div>
      </div>
    )
  }
}
