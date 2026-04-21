export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b flex items-center px-8 border-slate-200">
        <span className="font-black tracking-tighter text-slate-900">V.1.1.6 - DIRECT ACCESS MODE</span>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
