'use client'

import Link from 'next/link'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createManualLead } from '@/actions/lead-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const formSchema = z.object({
    firstName: z.string().min(2, 'Richiesto'),
    lastName: z.string().min(2, 'Richiesto'),
    email: z.string().email('Email non valida').optional().or(z.literal('')),
    phone: z.string().optional(),
    eventType: z.string().optional(),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    guestsCount: z.string().optional(),
    productInterest: z.string().optional(),
    preferredContactTime: z.string().optional(),
    additionalServices: z.array(z.string()).default([]),
})

const EVENT_TYPES = [
    "Matrimonio",
    "Comunione",
    "Battesimo",
    "Laurea",
    "Compleanno",
    "Evento Aziendale",
    "Altro"
]

const GUEST_RANGES = [
    "Meno di 50",
    "Tra 51 e 100",
    "Più di 100"
]

const CONTACT_TIMES = [
    "Mattina (9:30 - 13:00)",
    "Pausa Pranzo (13:00 - 15:00)",
    "Pomeriggio (15:30 - 18:00)",
    "Sera (19:00 - 20:30)"
]

const SERVICES = [
    { id: "live_show", label: "Live Show (Personalizzazione in LOCATION)" },
    { id: "delivery", label: "Consegna in Location" }
]

export function AddLeadDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            eventType: '',
            eventDate: '',
            eventLocation: '',
            guestsCount: '',
            productInterest: '',
            preferredContactTime: '',
            additionalServices: [],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const signupData = {
                ...values,
                additionalServices: values.additionalServices.join(', ')
            }
            const result = await createManualLead(signupData)
            if (result.success) {
                toast.success('Lead creato con successo')
                setOpen(false)
                form.reset()
            } else {
                toast.error('Errore durante la creazione del lead')
            }
        } catch (error) {
            toast.error('Errore imprevisto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] rounded-[2.5rem] border border-slate-200/50 shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[92vh]">
                <div className="p-8 pb-5 border-b border-slate-50 shrink-0">
                    <DialogHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <DialogTitle className="text-3xl font-black tracking-tight text-slate-900 uppercase leading-none">Aggiungi Nuovo Lead</DialogTitle>
                        <Button asChild variant="outline" className="rounded-xl border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-widest h-10 transition-all hover:scale-105">
                            <Link href="/leads/import" className="flex items-center gap-2">
                                <Database className="w-3 h-3" />
                                Caricamento Massivo (Excel)
                            </Link>
                        </Button>
                    </div>
                        <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
                             Inserimento manuale nella pipeline commerciale
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-5 pt-3 max-h-[72vh] overflow-y-auto custom-scrollbar space-y-5">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            {/* Sezione Anagrafica */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Informazioni Cliente</h4>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Nome</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Es: Mario" {...field} className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all text-sm" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Cognome</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Es: Rossi" {...field} className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all text-sm" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="mario.rossi@email.it" {...field} className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Telefono</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+39 333 123 4567" {...field} className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Dettagli Evento */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Dettagli Evento</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="eventType"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Tipologia</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Seleziona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl p-2">
                                                        {EVENT_TYPES.map(type => (
                                                            <SelectItem key={type} value={type} className="rounded-lg font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">
                                                                {type}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="eventDate"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Data</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2 px-4 transition-all" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <FormField
                                        control={form.control}
                                        name="guestsCount"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Invitati</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Numero..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl p-2">
                                                        {GUEST_RANGES.map(range => (
                                                            <SelectItem key={range} value={range} className="rounded-lg font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">
                                                                {range}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="preferredContactTime"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Orario Contatto</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Fascia..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl p-2">
                                                        {CONTACT_TIMES.map(time => (
                                                            <SelectItem key={time} value={time} className="rounded-lg font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="eventLocation"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Luogo / Location</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Cerca o inserisci location..." {...field} className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Servizi Extra */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Servizi Opzionali</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {SERVICES.map((service) => (
                                        <FormField
                                            key={service.id}
                                            control={form.control}
                                            name="additionalServices"
                                            render={({ field }) => {
                                                const isChecked = field.value?.includes(service.label);
                                                return (
                                                    <FormItem className={cn(
                                                        "flex flex-row items-center space-x-4 space-y-0 rounded-xl border-2 p-4 transition-all cursor-pointer group",
                                                        isChecked ? "border-indigo-500 bg-indigo-50/30" : "border-slate-50 bg-slate-50/30 hover:border-slate-100"
                                                    )}>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, service.label])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== service.label
                                                                            )
                                                                        )
                                                                }}
                                                                className="h-5 w-5 rounded-md border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-black text-slate-700 cursor-pointer w-full group-hover:text-indigo-600 transition-colors">
                                                            {service.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-6 border-t border-slate-50 flex items-center justify-end shrink-0 gap-4 bg-slate-50/30">
                    <Button variant="ghost" onClick={() => setOpen(false)} type="button" className="font-bold text-slate-400 h-11 px-6 hover:bg-transparent hover:text-slate-600">Annulla</Button>
                    <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={loading} className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-extrabold px-10 h-11 text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                        {loading ? 'Caricamento...' : 'Crea Lead'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
