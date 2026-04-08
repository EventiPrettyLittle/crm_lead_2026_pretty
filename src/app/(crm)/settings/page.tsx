'use client'

import { useState, useEffect } from 'react'
import { getCompanySettings, updateCompanySettings } from '@/actions/settings'
import { getAllUsers, deleteUser, createUser } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, CreditCard, User, Phone, Mail, Save, Loader2, Sparkles, ShieldCheck, Lock, Key, Fingerprint, Users, UserPlus, Trash2, ShieldAlert } from 'lucide-react'

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<{name: string, email: string, role?: string} | null>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        companyName: '',
        address: '',
        vatNumber: '',
        iban: '',
        phone: '',
        email: '',
        referente: ''
    });
    const [accountData, setAccountData] = useState({
        name: '',
        password: ''
    });
    const [newUserData, setNewUserData] = useState({
        name: '',
        email: '',
        role: 'OPERATOR',
        password: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getCompanySettings();
            if (data) {
                setSettings({
                    companyName: data.companyName || '',
                    address: data.address || '',
                    vatNumber: data.vatNumber || '',
                    iban: data.iban || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    referente: data.referente || ''
                });
            }
            
            const { getCurrentUser } = await import("@/actions/auth");
            const u = await getCurrentUser();
            setUser(u);
            if (u) {
                setAccountData({ name: u.name || '', password: '' });
                if (u.role === 'SUPER_ADMIN') {
                    const users = await getAllUsers();
                    setTeam(users);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await updateCompanySettings(settings);
            const { updateUser } = await import("@/actions/auth");
            const userRes = await updateUser(accountData);
            
            if (userRes.success) {
                toast.success("Impostazioni e profilo aggiornati");
                setTimeout(() => window.location.reload(), 800);
            } else {
                toast.success("Impostazioni salvate");
            }
        } catch (error) {
            toast.error("Errore salvataggio");
        } finally {
            setSaving(false);
        }
    }

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        if (!newUserData.email || !newUserData.name) return;
        setSaving(true);
        try {
            const res = await createUser(newUserData);
            if (res.success) {
                toast.success("Utente creato con successo");
                setNewUserData({ name: '', email: '', role: 'OPERATOR', password: '' });
                const users = await getAllUsers();
                setTeam(users);
            } else {
                toast.error(res.error || "Errore creazione utente");
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteTeamMember(id: string) {
        if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;
        setSaving(true);
        try {
            const res = await deleteUser(id);
            if (res.success) {
                toast.success("Utente eliminato");
                const users = await getAllUsers();
                setTeam(users);
            } else {
                toast.error(res.error || "Errore eliminazione");
            }
        } catch (err) {
            toast.error("Errore durante l'operazione");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'eventiprettylittle@gmail.com';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 italic">Settings</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest ml-1">Platform Control Center</p>
                </div>
                <div className="flex items-center gap-4">
                    {!isAdmin && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-full border border-rose-100 italic">
                            Sola Lettura (Admin Only)
                        </p>
                    )}
                    <Button 
                        onClick={handleSubmit} 
                        disabled={saving || !isAdmin}
                        className="rounded-2xl bg-slate-900 hover:bg-black h-12 px-8 font-black shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Applica Modifiche
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="company" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] mb-8 mx-4 inline-flex">
                    <TabsTrigger value="company" className="rounded-full px-8 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Building2 className="h-4 w-4 mr-2" />
                        Azienda
                    </TabsTrigger>
                    <TabsTrigger value="account" className="rounded-full px-8 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <User className="h-4 w-4 mr-2" />
                        Account
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="team" className="rounded-full px-8 py-2.5 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md">
                            <Users className="h-4 w-4 mr-2" />
                            Team & Permessi
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="company">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                        <div className="md:col-span-2 space-y-8">
                            {/* Azienda */}
                            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black">Informazioni Aziendali</CardTitle>
                                            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Dati fiscali e indirizzo principale</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Ragione Sociale</Label>
                                            <Input 
                                                value={settings.companyName} 
                                                onChange={e => setSettings({...settings, companyName: e.target.value})}
                                                disabled={!isAdmin}
                                                placeholder="Lead Events 2026"
                                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Partita IVA</Label>
                                            <Input 
                                                value={settings.vatNumber} 
                                                onChange={e => setSettings({...settings, vatNumber: e.target.value})}
                                                disabled={!isAdmin}
                                                placeholder="01234567890"
                                                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white disabled:opacity-50"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Indirizzo Sede Legale</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input 
                                                    value={settings.address} 
                                                    onChange={e => setSettings({...settings, address: e.target.value})}
                                                    disabled={!isAdmin}
                                                    placeholder="Via delle Aziende 123, Roma"
                                                    className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Referente */}
                            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black">Referente Piattaforma</CardTitle>
                                            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Chi firmerà i preventivi</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome e Cognome Referente</Label>
                                        <Input 
                                            value={settings.referente} 
                                            onChange={e => setSettings({...settings, referente: e.target.value})}
                                            disabled={!isAdmin}
                                            placeholder="Luca Vitale"
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white disabled:opacity-50"
                                        />
                                        <p className="text-[10px] text-slate-400 italic">Usato in Dashboard e preventivi.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white shrink-0">
                                <CardHeader className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                                    <Sparkles className="absolute top-2 right-2 h-16 w-16 opacity-10" />
                                    <CardTitle className="text-xl font-black">Contatti</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Telefono</Label>
                                        <Input 
                                            value={settings.phone} 
                                            onChange={e => setSettings({...settings, phone: e.target.value})}
                                            disabled={!isAdmin}
                                            className="p-4 rounded-xl border-slate-100 bg-slate-50/50 font-bold disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email</Label>
                                        <Input 
                                            value={settings.email} 
                                            onChange={e => setSettings({...settings, email: e.target.value})}
                                            disabled={!isAdmin}
                                            className="p-4 rounded-xl border-slate-100 bg-slate-50/50 font-bold disabled:opacity-50"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="account">
                    <div className="max-w-4xl space-y-8 px-4 mx-auto">
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                        <Fingerprint className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black">Mio Profilo</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Gestione dati personali</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Fissa)</Label>
                                        <Input value={user?.email || ""} readOnly className="h-12 rounded-xl border-slate-100 bg-slate-50 text-slate-400 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Visualizzato</Label>
                                        <Input 
                                            value={accountData.name} 
                                            onChange={e => setAccountData({...accountData, name: e.target.value})}
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuova Password</Label>
                                    <Input 
                                        type="password"
                                        value={accountData.password} 
                                        onChange={e => setAccountData({...accountData, password: e.target.value})}
                                        placeholder="Lascia vuoto per non cambiare"
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="team">
                    <div className="max-w-5xl space-y-8 px-4 mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                                <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black">Utenti Piattaforma</CardTitle>
                                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Lista account interni attivi</CardDescription>
                                    </div>
                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-4 py-1.5 rounded-full">{team.length} Utenti</Badge>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50/50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <tr>
                                                    <th className="px-8 py-4 text-left">Utente</th>
                                                    <th className="px-8 py-4 text-left">Ruolo</th>
                                                    <th className="px-8 py-4 text-right">Azione</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {team.map((m) => (
                                                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                                    {m.name?.[0] || m.email[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">{m.name || "Senza Nome"}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <Badge className={cn(
                                                                "font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full",
                                                                m.role === 'SUPER_ADMIN' ? "bg-slate-900 text-white shadow-lg" : 
                                                                m.role === 'ADMIN' ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                                                            )}>
                                                                {m.role}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            {m.email !== user?.email && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => handleDeleteTeamMember(m.id)}
                                                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                                >
                                                                    <Trash2 className="h-4.5 w-4.5" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white h-fit">
                                <CardHeader className="bg-slate-900 p-8 text-white">
                                    <div className="flex items-center gap-3">
                                        <UserPlus className="h-6 w-6 text-indigo-400" />
                                        <CardTitle className="text-xl font-black italic">Nuovo Account</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nome Operatore</Label>
                                            <Input 
                                                value={newUserData.name} 
                                                onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                                                placeholder="Es: Maria Bianchi"
                                                className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Accesso</Label>
                                            <Input 
                                                value={newUserData.email} 
                                                onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                                                placeholder="maria@lead-events.it"
                                                className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ruolo Piattaforma</Label>
                                            <select 
                                                value={newUserData.role}
                                                onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                                                className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="OPERATOR">OPERATORE (Standard)</option>
                                                <option value="ADMIN">ADMIN (Privilegiato)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password Accesso</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input 
                                                    type="password"
                                                    value={newUserData.password} 
                                                    onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                                                    placeholder="Scegli password"
                                                    className="h-11 pl-10 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleAddUser}
                                            disabled={saving}
                                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 transition-all"
                                        >
                                            Crea Account
                                        </Button>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                                        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                            L'utente potrà accedere tramite Google. Un account ADMIN avrà permessi estesi ma non potrà gestire il team.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

function Separator() {
    return <div className="h-px bg-slate-100 w-full" />;
}
