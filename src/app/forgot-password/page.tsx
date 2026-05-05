'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { forgotPassword } from "@/actions/auth"
import { ArrowLeft, Mail, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        try {
            const result = await forgotPassword(email);
            if (result.success) {
                setSent(true);
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Errore durante la richiesta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl" />
            
            <div className="w-full max-w-md relative z-10">
                <div className="mb-8 flex justify-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Torna al Login
                    </Link>
                </div>

                <Card className="rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-12 space-y-8">
                        {!sent ? (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                        <Mail className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 italic">Password Dimenticata?</h2>
                                    <p className="text-slate-400 text-sm font-bold">Inserisci la tua email e ti invieremo un link per reimpostarla.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email di Registrazione</Label>
                                        <Input 
                                            name="email" 
                                            type="email" 
                                            required 
                                            placeholder="la-tua-email@esempio.it"
                                            className="h-14 rounded-2xl border-slate-100 bg-white font-bold text-lg"
                                        />
                                    </div>
                                    <Button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-100 transition-all"
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Invia Link di Recupero"}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center space-y-6 py-4">
                                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
                                    <Sparkles className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">Email Inviata!</h3>
                                    <p className="text-slate-500 font-medium">Controlla la tua casella di posta (e anche lo spam) per il link di reset.</p>
                                </div>
                                <Button asChild className="w-full h-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold">
                                    <Link href="/login">Torna al Login</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Platinum CRM Secure Recovery System
                </p>
            </div>
        </div>
    )
}
