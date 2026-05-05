'use client'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { resetPassword } from "@/actions/auth"
import { ShieldCheck, Loader2, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!token) {
            toast.error("Token mancante");
            return;
        }

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirm = formData.get('confirm') as string;

        if (password !== confirm) {
            toast.error("Le password non coincidono");
            return;
        }

        if (password.length < 6) {
            toast.error("La password deve essere di almeno 6 caratteri");
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(token, password);
            if (result.success) {
                setSuccess(true);
                toast.success("Password aggiornata con successo!");
                setTimeout(() => router.push('/login'), 3000);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Errore durante il reset");
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Token non valido</h3>
                    <p className="text-slate-500 font-medium">Il link di reset è incompleto o scaduto.</p>
                </div>
                <Button asChild className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold">
                    <Link href="/forgot-password">Richiedi un nuovo link</Link>
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                    <Sparkles className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Password Aggiornata!</h3>
                    <p className="text-slate-500 font-medium">La tua nuova password è attiva. Verrai reindirizzato al login tra pochi secondi...</p>
                </div>
                <Button asChild className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold">
                    <Link href="/login">Vai al Login</Link>
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 italic">Nuova Password</h2>
                <p className="text-slate-400 text-sm font-bold">Scegli una password sicura per il tuo account.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nuova Password</Label>
                    <Input 
                        name="password" 
                        type="password" 
                        required 
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-slate-100 bg-white font-bold text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Conferma Password</Label>
                    <Input 
                        name="confirm" 
                        type="password" 
                        required 
                        placeholder="••••••••"
                        className="h-14 rounded-2xl border-slate-100 bg-white font-bold text-lg"
                    />
                </div>
            </div>

            <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-100 transition-all"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Aggiorna Password"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl" />
            
            <div className="w-full max-w-md relative z-10">
                <Card className="rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12">
                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifica token...</p>
                            </div>
                        }>
                            <ResetPasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
