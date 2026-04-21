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
  // 1. Preveniamo il redirect selvaggio se è in corso una Server Action
  const headersList = await headers();
  const isAction = headersList.has('next-action');
  
  // GATEKEEPER SERVER-SIDE (Disabilitato temporaneamente per eliminare i logout molesti)
  const user = await getCurrentUser();
  
  /* 
  if (!user && !isAction) {
    return redirect("/login?reason=layout_auth_required_disabled_v1.1.2");
  }
  */

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
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter">
              CRM V.1.1.3 - UNSTOPPABLE SESSION
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
}
