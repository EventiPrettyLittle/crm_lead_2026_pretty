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
import { Edit2, MapPin, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
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
    phoneRaw: z.string().optional(),
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
    const autoCompleteRef = useRef<any>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            firstName: lead.firstName || '',
            lastName: lead.lastName || '',
            email: lead.email || '',
            phoneRaw: lead.phoneRaw || '',
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
        
        // Inject global style for Google Autocomplete once - FORZA VISIBILITÀ TOTALE
        if (!document.getElementById('pac-style')) {
            const style = document.createElement('style');
            style.id = 'pac-style';
            style.innerHTML = `
                .pac-container { 
                    z-index: 99999 !important; 
                    pointer-events: auto !important;
                    font-family: inherit; 
                    border-radius: 1.5rem; 
                    margin-top: 8px; 
                    border: 2px solid #6366f1; 
                    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5); 
                } 
                .pac-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f1f5f9; } 
                .pac-item:hover { background-color: #f8fafc; } 
                .pac-item-query { font-weight: 700; color: #4f46e6; font-size: 14px; }
            `;
            document.head.appendChild(style);
        }
    }, [open]);

    useEffect(() => {
        let retryInterval: NodeJS.Timeout;
        let autocomplete: any = null;

        const setupAutocomplete = () => {
            const input = document.getElementById('location-input') as HTMLInputElement;
            if (!input || !window.google) return false;

            try {
                autocomplete = new window.google.maps.places.Autocomplete(input, {
                    fields: ["formatted_address", "geometry", "name", "address_components"],
                    types: ["establishment", "geocode"],
                });

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete!.getPlace();
                    if (!place.geometry) return;

                    let city = '', province = '', region = '';
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            if (types.includes('locality')) city = component.long_name;
                            if (types.includes('administrative_area_level_2')) province = component.short_name;
                            if (types.includes('administrative_area_level_1')) region = component.long_name;
                        }
                    }

                    const finalName = place.name || place.formatted_address || '';
                    form.setValue('eventLocation', finalName, { shouldDirty: true });
                    form.setValue('locationName', place.name || '', { shouldDirty: true });
                    form.setValue('eventCity', city, { shouldDirty: true });
                    form.setValue('eventProvince', province, { shouldDirty: true });
                    form.setValue('eventRegion', region, { shouldDirty: true });
                    
                    toast.success('Dati aggiornati via Google!');
                });

                autoCompleteRef.current = autocomplete;
                return true;
            } catch (err) {
                console.error("Errore Autocomplete:", err);
                return false;
            }
        };

        if (open) {
            const success = setupAutocomplete();
            if (!success) {
                let attempts = 0;
                retryInterval = setInterval(() => {
                    attempts++;
                    if (setupAutocomplete() || attempts > 20) {
                        clearInterval(retryInterval);
                    }
                }, 100);
            }
        }

        return () => {
            if (retryInterval) clearInterval(retryInterval);
            if (autocomplete) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        };
    }, [open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const finalValues = { 
                ...values, 
                additionalServices: values.additionalServices.join(', '),
                eventDate: values.eventDate ? new Date(values.eventDate) : undefined
            }
            
            const result = await updateLeadDetails(lead.id, finalValues)
            if (result.success) {
                toast.success('Lead aggiornato con successo')
                router.refresh()
                setOpen(false)
            } else {
                toast.error('Errore: ' + (result as any).error)
            }
        } catch (error: any) {
            toast.error('Errore di sistema: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 hover:border-indigo-400 group h-12 px-6 font-black transition-all shadow-sm">
                    <Edit2 className="mr-2 h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    Modifica Dati
                </Button>
            </DialogTrigger>
            <DialogContent 
                className="sm:max-w-[700px] rounded-[3rem] border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col"
            >
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-8 text-white shrink-0 relative">
                    <DialogTitle className="text-3xl font-black tracking-tighter mb-1 uppercase">Gestione Dati Lead</DialogTitle>
                    <DialogDescription className="text-indigo-100 font-medium text-xs opacity-90 tracking-tight">Perfeziona i dettagli dell'evento e aggiorna i contatti territoriali.</DialogDescription>
                    <div className="absolute top-8 right-8 bg-white/10 rounded-full h-12 w-12 flex items-center justify-center backdrop-blur-md border border-white/20">
                        <User className="h-6 w-6 text-white" />
                    </div>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-10 pt-6 space-y-8 custom-scrollbar">
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Informazioni Cliente</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Nome" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="lastName" render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Cognome" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Email" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="phoneRaw" render={({ field }) => (
                                    <FormItem><FormControl><Input placeholder="Telefono" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-50 pt-8">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configurazione Evento</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="eventType" render={({ field }) => (
                                    <FormItem><Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold"><SelectValue placeholder="Scegli..." /></SelectTrigger></FormControl>
                                        <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )} />
                                <FormField control={form.control} name="eventDate" render={({ field }) => (
                                    <FormItem><FormControl><Input type="date" className="h-12 rounded-2xl bg-slate-50/50 border-slate-100 font-bold" {...field} /></FormControl></FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-50 pt-8">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-600" />
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Geolocalizzazione (Cerca per Nome Villa o Indirizzo)</h3>
                            </div>
                             <FormField control={form.control} name="eventLocation" render={({ field }) => (
                                <FormItem><FormControl><div className="relative">
                                    <Input 
                                        {...field} 
                                        id="location-input"
                                        ref={(e) => { 
                                            field.ref(e); 
                                            (inputRef as any).current = e; 
                                        }} 
                                        autoComplete="off"
                                        className="h-16 rounded-2xl pl-12 border-2 border-indigo-100 bg-white font-bold text-slate-900 shadow-xl focus:border-indigo-600 transition-all placeholder:text-slate-300" 
                                        placeholder="Cerca Villa o Indirizzo..." 
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-indigo-500" />
                                </div></FormControl></FormItem>
                            )} />
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Città</p><p className="text-[11px] font-black text-slate-800">{watchCity || '-'}</p></div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Prov</p><p className="text-[11px] font-black text-slate-800">{watchProvince || '-'}</p></div>
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center"><p className="text-[8px] font-bold text-indigo-500 uppercase mb-1">Regione</p><p className="text-[11px] font-black text-slate-800">{watchRegion || '-'}</p></div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-50 pt-8 pb-4">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Servizi Aggiuntivi</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {SERVICES.map((service) => (
                                    <FormField
                                        key={service.id}
                                        control={form.control}
                                        name="additionalServices"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center space-x-3 space-y-0 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(service.label)}
                                                        onCheckedChange={(checked) => {
                                                            const current = field.value || []
                                                            const updated = checked 
                                                                ? [...current, service.label]
                                                                : current.filter((val) => val !== service.label)
                                                            field.onChange(updated)
                                                        }}
                                                        className="h-6 w-6 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                    />
                                                </FormControl>
                                                <label className="text-sm font-black text-slate-700 leading-none cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                    {service.label}
                                                </label>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                             <Button type="submit" disabled={loading} className="w-full h-16 rounded-[1.8rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.15em] shadow-2xl shadow-indigo-200 transition-all active:scale-95">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sincronizza e Salva Modifiche'}
                             </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
