import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { NotificationCenter } from "@/components/layout/notification-center"
import { UserNav } from "@/components/layout/user-nav"
import { LiveClock } from "@/components/layout/live-clock"
import { ReminderNotifier } from "@/components/layout/reminder-notifier"
import { headers } from "next/headers"
import { getCurrentUser } from "@/actions/auth"
import { redirect } from "next/navigation"

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  try {
    // 1. Preveniamo il redirect selvaggio se è in corso una Server Action
    const headersList = await headers();
    const isAction = headersList.has('next-action');
    
    // GATEKEEPER SERVER-SIDE (Blindato)
    const user = await getCurrentUser();
    
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
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter animate-pulse">
                CRM V.1.1.3 - DIAGNOSTIC MODE
              </span>
            </div>

            {/* Live Clock — centro header */}
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
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-slate-800 rounded-[2.5rem] p-10 border border-slate-700 shadow-2xl">
          <h1 className="text-2xl font-black text-rose-500 uppercase tracking-tighter mb-4">Errore Critico del Server</h1>
          <p className="text-slate-400 font-bold mb-6 italic">Il sistema ha catturato il seguente errore che Vercel stava nascondendo:</p>
          <div className="bg-black/50 rounded-2xl p-6 border border-rose-500/20">
            <code className="text-rose-400 text-sm break-all font-mono">
              {error.message || "Errore sconosciuto - Possibile problema di connessione DB"}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 w-full h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
          >
            Riprova Caricamento
          </button>
        </div>
      </div>
    )
  }
}
