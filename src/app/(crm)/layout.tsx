import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { NotificationCenter } from "@/components/layout/notification-center"
import { UserNav } from "@/components/layout/user-nav"
import { LiveClock } from "@/components/layout/live-clock"
import { ReminderNotifier } from "@/components/layout/reminder-notifier"
import { getCurrentUser } from "@/actions/auth"

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  // Integrazione sicura dell'utente
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
