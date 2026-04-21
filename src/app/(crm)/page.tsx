import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, PhoneCall, Users, TrendingUp, Calendar, ArrowRight, CheckCircle2, Sparkles, Zap, Clock, FileText } from "lucide-react"
import { getDashboardStats } from "@/actions/dashboard"
import { getCurrentUser } from "@/actions/auth"
import { getCompanySettings } from "@/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getCurrentUser();
  const settings = await getCompanySettings();
  
  const displayName = settings?.referente || user?.name || user?.email?.split('@')[0] || 'Utente';
  const firstName = displayName.split(' ')[0];

  const progressPercentage = stats.todayTasks > 0 
    ? Math.min((stats.callsDone / stats.todayTasks) * 100, 100) 
    : 0;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Morning Report — {format(new Date(), 'dd MMMM yyyy')}</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">
            Bentornato, <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-8 transition-all hover:decoration-indigo-600">{firstName}</span>.
          </h1>
          <p className="text-slate-400 font-bold text-lg">Pronto a rendere unici i momenti di oggi? 👋</p>
        </div>
        
        <div className="flex gap-4">
           <Button asChild className="rounded-2xl bg-slate-900 hover:bg-black h-12 px-6 font-black shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
             <Link href="/leads/import">
               <Upload className="mr-2 h-4 w-4" />
               Importa Lead
             </Link>
           </Button>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <CardContent className="p-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/5 w-fit">
                <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Obiettivo Giornaliero</span>
              </div>
              <h3 className="text-3xl font-black text-white italic">Carico oggi?</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">
                Hai <span className="text-white">{stats.todayTasks} lead</span> che aspettano la tua chiamata. Hai già gestito <span className="text-indigo-400">{stats.callsDone} persone</span> finora.
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-white font-black italic text-2xl">{Math.floor(progressPercentage)}% Completato</span>
                 <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{stats.callsDone} / {stats.todayTasks} Chiamate</span>
               </div>
               <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-xl">
                 <div 
                   className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                   style={{ width: `${progressPercentage}%` }}
                 />
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, label: "Totale Lead", value: stats.totalLeads, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Zap, label: "Gestiti Oggi", value: stats.callsDone, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: FileText, label: "Preventivi Oggi", value: stats.quotesToday, color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Clock, label: "In Attesa", value: Math.max(0, stats.todayTasks - stats.callsDone), color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, idx) => (
          <Card key={idx} className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-8 space-y-4">
              <div className={`p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{item.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
