'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginWithCredentials, getCurrentUser } from "@/actions/auth"
import { getSystemSettings } from "@/actions/settings-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogIn, Sparkles, ShieldCheck, Zap, Globe, Loader2 } from "lucide-react"

export default function LoginPage() {
    const [mode, setMode] = useState<'selection' | 'credentials'>('selection');
    const [loading, setLoading] = useState(false);
    const [logoSettings, setLogoSettings] = useState({ logoUrl: '', companyName: 'Lead Events 2026' });
    const router = useRouter();

    useEffect(() => {
        getSystemSettings().then(settings => {
            if (settings) {
                setLogoSettings({
                    logoUrl: settings.logoUrl || '',
                    companyName: settings.companyName || 'Lead Events 2026'
                });
            }
        });
    }, []);

    async function handleCredentialLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            const result = await loginWithCredentials(formData);
            if (result.success) {
                toast.success("Accesso effettuato");
                router.push('/');
                router.refresh();
            } else {
                toast.error(result.error || "Credenziali non valide");
            }
        } catch (error) {
            toast.error("Errore durante l'accesso");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl animate-pulse" />

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Side: Branding & Info */}
                <div className="space-y-10 text-center lg:text-left">
                    <div className="space-y-6">
                        {/* Logo Container */}
                        <div className="flex justify-center lg:justify-start">
                            <div className="h-40 w-64 flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
                                {logoSettings.logoUrl ? (
                                    <img 
                                        src={logoSettings.logoUrl} 
                                        alt="Logo" 
                                        className="h-full w-full object-contain filter drop-shadow-sm"
                                    />
                                ) : (
                                    <Globe className="h-20 w-20 text-indigo-600 animate-pulse" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-indigo-100 shadow-sm">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">{logoSettings.companyName}</span>
                            </div>
                            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] italic uppercase">
                                Your Event <br/> <span className="text-indigo-600 relative inline-block">
                                    Our Vision
                                    <span className="absolute bottom-2 left-0 w-full h-[0.2em] bg-indigo-100/80 -z-10 -skew-x-12" />
                                </span>
                            </h1>
                            <p className="text-xl text-slate-400 font-bold max-w-lg mx-auto lg:mx-0 italic">
                                Siamo qui per rendere unici ogni momento
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="flex justify-center lg:justify-end">
                    <Card className="w-full max-w-md rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-12 space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-3xl font-black text-slate-900 italic">Benvenuto</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Accedi per continuare</p>
                            </div>

                            {mode === 'selection' ? (
                                <div className="space-y-4">
                                    <Button 
                                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] group border border-slate-800"
                                        asChild
                                    >
                                        <a href="/api/auth/google/login">
                                            <LogIn className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform text-amber-400" />
                                            Accedi con Google
                                        </a>
                                    </Button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300 bg-white px-4">Oppure</div>
                                    </div>

                                    <Button 
                                        onClick={() => setMode('credentials')}
                                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-800"
                                    >
                                        Accedi con Email e Password
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleCredentialLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                                        <Input 
                                            name="email" 
                                            type="email" 
                                            required 
                                            placeholder="la-tua-email@esempio.it"
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                                        <Input 
                                            name="password" 
                                            type="password" 
                                            required 
                                            placeholder="••••••••"
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                                        />
                                    </div>
                                    <Button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-xl transition-all"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entra nella Piattaforma"}
                                    </Button>
                                    <button 
                                        type="button"
                                        onClick={() => setMode('selection')}
                                        className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        Torna indietro
                                    </button>
                                </form>
                            )}

                            <div className="pt-4 text-center">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized Access Only</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer decoration */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400/50 font-black text-[10vw] select-none pointer-events-none opacity-10 leading-none">
                PLATINUM
            </div>
        </div>
    )
}
