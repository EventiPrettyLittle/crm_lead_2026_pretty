'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google: any;
  }
}
import { Edit2, MapPin } from 'lucide-react'
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
import { updateLeadDetails } from '@/actions/lead-actions'
import { toast } from 'sonner'
import { Lead } from '@prisma/client'
import { cn } from "@/lib/utils"

const formSchema = z.object({
    firstName: z.string().min(2, 'Richiesto'),
    lastName: z.string().min(2, 'Richiesto'),
    email: z.string().email('Email non valida').optional().or(z.literal('')),
    phone: z.string().optional(),
    eventType: z.string().optional(),
    eventDate: z.string().optional(),
    eventLocation: z.string().optional(),
    locationName: z.string().optional(),
    eventCity: z.string().optional(),
    eventProvince: z.string().optional(),
    eventRegion: z.string().optional(),
    guestsCount: z.string().optional(),
    productInterest: z.string().optional(),
    preferredContactTime: z.string().optional(),
    additionalServices: z.array(z.string()).default([]),
})

interface EditLeadDialogProps {
    lead: Lead;
}

const EVENT_TYPES = [
    "Matrimonio", "Comunione", "Battesimo", "Laurea", "Compleanno", "Evento Aziendale", "Altro"
]

const GUEST_RANGES = [
    "Meno di 50", "Tra 51 e 100", "Più di 100"
]

const CONTACT_TIMES = [
    "Mattina (9:30 - 13:00)", "Pausa Pranzo (13:00 - 15:00)", "Pomeriggio (15:30 - 18:00)", "Sera (19:00 - 20:30)"
]

const SERVICES = [
    { id: "live_show", label: "Live Show (Personalizzazione in LOCATION)" },
    { id: "delivery", label: "Consegna in Location" }
]

export function EditLeadDialog({ lead }: EditLeadDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const autoCompleteRef = useRef<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            firstName: lead.firstName || '',
            lastName: lead.lastName || '',
            email: lead.email || '',
            phone: lead.phoneRaw || '',
            eventType: lead.eventType || '',
            eventDate: lead.eventDate ? new Date(lead.eventDate).toISOString().split('T')[0] : '',
            eventLocation: lead.eventLocation || '',
            locationName: (lead as any).locationName || '',
            eventCity: lead.eventCity || '',
            eventProvince: lead.eventProvince || '',
            eventRegion: lead.eventRegion || '',
            guestsCount: lead.guestsCount ? String(lead.guestsCount) : '',
            productInterest: lead.productInterest || '',
            preferredContactTime: (lead as any).preferredContactTime || '',
            additionalServices: (lead as any).additionalServices ? (lead as any).additionalServices.split(', ') : [],
        },
    })

    const watchCity = form.watch('eventCity')
    const watchProvince = form.watch('eventProvince')
    const watchRegion = form.watch('eventRegion')

    useEffect(() => {
        if (!open) return;
        const initAutocomplete = () => {
             if (inputRef.current && window.google) {
                autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: "it" },
                    fields: ["address_components", "formatted_address", "geometry", "name"]
                });
                autoCompleteRef.current.addListener("place_changed", () => {
                    const place = autoCompleteRef.current.getPlace();
                    if (!place.geometry) return;
                    if (place.formatted_address) form.setValue('eventLocation', place.formatted_address);
                    if (place.name) form.setValue('locationName', place.name);
                    let city = '', province = '', region = '';
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            if (types.includes('locality')) city = component.long_name;
                            if (types.includes('administrative_area_level_2')) province = component.short_name;
                            if (types.includes('administrative_area_level_1')) region = component.long_name;
                        }
                    }
                    form.setValue('eventCity', city);
                    form.setValue('eventProvince', province);
                    form.setValue('eventRegion', region);
                });
             }
        };
        setTimeout(initAutocomplete, 500);
    }, [open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const finalValues = { ...values, additionalServices: values.additionalServices.join(', ') }
            const result = await updateLeadDetails(lead.id, finalValues)
            if (result.success) {
                toast.success('Dati salvati!')
                router.refresh()
                setOpen(false)
            } else {
                toast.error(`Errore nel salvataggio`)
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
                <Button variant="outline" size="sm" className="rounded-2xl border-slate-200">
                    <Edit2 className="mr-2 h-4 w-4" /> Modifica Dati
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] rounded-[2.5rem] p-0 overflow-hidden bg-white max-h-[92vh] flex flex-col">
                <DialogHeader className="bg-slate-900 p-6 text-white shrink-0">
                    <DialogTitle className="text-xl font-bold">Modifica Lead</DialogTitle>
                    <DialogDescription className="text-slate-400">Aggiorna i dettagli anagrafici e dell'evento.</DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Nome</FormLabel><FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Cognome</FormLabel><FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold" {...field} /></FormControl></FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Email</FormLabel><FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold" {...field} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Telefono</FormLabel><FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold" {...field} /></FormControl></FormItem>
                            )} />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dettagli Evento</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="eventType" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400">TIPO</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Scegli..." /></SelectTrigger></FormControl>
                                        <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )} />
                                <FormField control={form.control} name="eventDate" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400">DATA</FormLabel><FormControl><Input type="date" className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="guestsCount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400">INVITATI</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Range..." /></SelectTrigger></FormControl>
                                        <SelectContent>{GUEST_RANGES.map(r => <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )} />
                                <FormField control={form.control} name="preferredContactTime" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-bold text-slate-400">CONTATTO</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Fascia..." /></SelectTrigger></FormControl>
                                        <SelectContent>{CONTACT_TIMES.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Geolocalizzazione</h4>
                            <FormField control={form.control} name="eventLocation" render={({ field: { ref: fieldRef, ...fieldProps } }) => (
                                <FormItem><FormControl><div className="relative">
                                    <Input {...fieldProps} ref={(e) => { fieldRef(e); (inputRef as any).current = e; }} className="h-12 rounded-xl pl-10 border-slate-100 bg-slate-50 font-bold" placeholder="Cerca Indirizzo o Location..." />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                                </div></FormControl></FormItem>
                            )} />
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Città</p><p className="text-xs font-black">{watchCity || '-'}</p></div>
                                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Prov</p><p className="text-xs font-black">{watchProvince || '-'}</p></div>
                                <div className="p-3 bg-indigo-50 rounded-xl text-center border border-indigo-100"><p className="text-[8px] font-bold text-indigo-500 uppercase mb-1">Regione</p><p className="text-xs font-black">{watchRegion || '-'}</p></div>
                            </div>
                        </div>

                        <div className="pt-4 pb-2">
                            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                            </Button>
                        </div>

                        <input type="hidden" {...form.register('eventCity')} />
                        <input type="hidden" {...form.register('locationName')} />
                        <input type="hidden" {...form.register('eventProvince')} />
                        <input type="hidden" {...form.register('eventRegion')} />
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
