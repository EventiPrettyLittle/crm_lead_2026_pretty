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

import { initDatabase } from "@/actions/db-init"

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (e) {
    console.error("Layout Auth Error:", e);
  }

  if (!user) {
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
            Per accedere ai dati sensibili del CRM è necessario autenticarsi. Se avevi già effettuato l'accesso, la tua sessione potrebbe essere scaduta per sicurezza.
          </p>
          <a 
            href="/login" 
            className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
          >
            Vai al Login
          </a>
          <p className="text-[10px] text-slate-300 font-bold uppercase italic tracking-tighter">
            Pretty Little CRM — Security Layer 2.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-[#f8fafc] relative min-h-screen">
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300 px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <SidebarTrigger className="h-10 w-10 text-slate-500 hover:text-indigo-600 transition-colors" />
            <div className="h-8 w-px bg-slate-200" />
          </div>

          <div className="flex-1 max-w-2xl px-4 flex items-center gap-4">
            <GlobalSearch />
            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter">
              SECURE SESSION ACTIVATED
            </span>
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
}
