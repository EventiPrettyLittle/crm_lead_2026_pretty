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
import { Edit2, MapPin, Navigation, CheckCircle2, AlertCircle } from 'lucide-react'
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
             if (inputRef.current && window.google && window.google.maps && window.google.maps.places) {
                autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: "it" },
                    fields: ["address_components", "formatted_address", "geometry", "name"]
                });
                
                autoCompleteRef.current.addListener("place_changed", () => {
                    const place = autoCompleteRef.current.getPlace();
                    console.log("Full Place Object:", place);
                    
                    if (!place.geometry) {
                        setStatusMessage("Seleziona un'opzione dall'elenco suggerito");
                        return;
                    }

                    setStatusMessage(null);
                    
                    // Indirizzo Formattato
                    if (place.formatted_address) {
                        form.setValue('eventLocation', place.formatted_address);
                    } else if (place.name) {
                        form.setValue('eventLocation', place.name);
                    }

                    if (place.name) {
                        form.setValue('locationName', place.name);
                    }

                    let city = '';
                    let province = '';
                    let region = '';

                    // 1. Estrazione Standard dai componenti
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            
                            // Logica robusta per la Città (Locality o rimpiazzi)
                            if (types.includes('locality')) {
                                city = component.long_name;
                            } else if (!city && types.includes('administrative_area_level_3')) {
                                city = component.long_name;
                            } else if (!city && types.includes('sublocality_level_1')) {
                                city = component.long_name;
                            }

                            // Provincia (Livello 2)
                            if (types.includes('administrative_area_level_2')) {
                                province = component.short_name; // RM, SA, MI
                            }

                            // Regione (Livello 1)
                            if (types.includes('administrative_area_level_1')) {
                                region = component.long_name;
                            }
                        }
                    }

                    // 2. Fallback: Se la città è ancora vuota, proviamo a cercarla nel formatted_address
                    if (!city && place.formatted_address) {
                        const parts = place.formatted_address.split(',');
                        if (parts.length >= 2) {
                            // Spesso la città è la penultima o terzultima parte prima della provincia/CAP
                            city = parts[parts.length - 3]?.trim() || parts[parts.length - 2]?.trim() || '';
                        }
                    }

                    form.setValue('eventCity', city, { shouldDirty: true, shouldValidate: true });
                    form.setValue('eventProvince', province, { shouldDirty: true, shouldValidate: true });
                    form.setValue('eventRegion', region, { shouldDirty: true, shouldValidate: true });
                });
             }
        };

        const scriptId = 'google-maps-script';
        if (!window.google) {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!document.getElementById(scriptId) && apiKey) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                script.async = true;
                script.onload = () => initAutocomplete();
                document.head.appendChild(script);
            }
        } else {
            setTimeout(initAutocomplete, 200); // Ritardo leggero per garantire il mount
        }

    }, [open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const finalValues = {
                ...values,
                additionalServices: values.additionalServices.join(', ')
            }
            const result = await updateLeadDetails(lead.id, finalValues)
            if (result.success) {
                toast.success('Dati salvati con successo!')
                router.refresh()
                setOpen(false)
            } else {
                toast.error(`Errore nel salvataggio: ${result.error}`)
            }
        } catch (error) {
            toast.error('Errore imprevisto durante l\'aggiornamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-2xl border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 transition-all font-black px-6 py-5 shadow-sm group">
                    <Edit2 className="mr-2 h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                    Modifica Dati
                </Button>
            </DialogTrigger>
            <DialogContent 
                onInteractOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('.pac-container')) {
                        e.preventDefault();
                    }
                }}
                className="sm:max-w-[620px] rounded-[2.5rem] border border-slate-200/50 shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[92vh]"
            >
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 text-white relative h-32 flex flex-col justify-end shrink-0">
                    <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1 text-white">
                         Gestione Dati Lead
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 font-medium opacity-90 max-w-sm leading-relaxed text-[11px]">
                        Perfeziona i dettagli dell'evento e aggiorna i contatti.
                    </DialogDescription>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-6 pt-3 space-y-5 custom-scrollbar pb-8">
                             {/* Anagrafica */}
                             <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Informazioni Cliente</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Nome</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Cognome</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Email</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Telefono</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 border-2 font-bold transition-all" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                             {/* Dettagli Evento */}
                             <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configurazione Evento</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="eventType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Tipologia</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Seleziona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                                        {EVENT_TYPES.map(t => (
                                                            <SelectItem key={t} value={t} className="rounded-xl font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="eventDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Data</FormLabel>
                                                <FormControl>
                                                    <Input type="date" className="rounded-xl border-slate-200 bg-slate-50/50 font-bold h-12" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="guestsCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Invitati</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Range..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                                        {GUEST_RANGES.map(r => (
                                                            <SelectItem key={r} value={r} className="rounded-xl font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">{r}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="preferredContactTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Contatto</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-indigo-500 font-bold border-2">
                                                            <SelectValue placeholder="Fascia..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                                        {CONTACT_TIMES.map(c => (
                                                            <SelectItem key={c} value={c} className="rounded-xl font-bold text-slate-600 focus:bg-indigo-50 focus:text-indigo-600 my-1">{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Location Search */}
                            <div className="space-y-4 pt-4">
                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Geolocalizzazione
                                </h4>
                                <FormField
                                    control={form.control}
                                    name="eventLocation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        autoComplete="off"
                                                        className="rounded-2xl border-2 border-slate-100 bg-slate-50/30 py-8 pl-14 pr-6 font-black text-slate-800 focus:ring-indigo-500 shadow-inner" 
                                                        placeholder="Cerca Ville, Location o Indirizzo..." 
                                                        {...field}
                                                        ref={(e) => {
                                                            field.ref(e);
                                                            (inputRef as any).current = e;
                                                        }}
                                                    />
                                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                                                </div>
                                            </FormControl>
                                            {statusMessage && (
                                                <p className="text-[11px] font-bold text-rose-500 mt-2">{statusMessage}</p>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-3 gap-4">
                                   <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Città</p>
                                      <p className="text-xs font-black text-slate-800 truncate">{watchCity || '---'}</p>
                                   </div>
                                   <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prov</p>
                                      <p className="text-xs font-black text-slate-800 truncate">{watchProvince || '---'}</p>
                                   </div>
                                   <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Regione</p>
                                      <p className="text-xs font-black text-slate-800 truncate">{watchRegion || '---'}</p>
                                   </div>
                                </div>
                            </div>

                             {/* Servizi Aggiuntivi */}
                             <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 rounded-full bg-indigo-500" />
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Extra & Servizi</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {SERVICES.map((s) => (
                                        <FormField
                                            key={s.id}
                                            control={form.control}
                                            name="additionalServices"
                                            render={({ field }) => {
                                                const isChecked = field.value?.includes(s.label);
                                                return (
                                                    <FormItem className={cn(
                                                        "flex flex-row items-center space-x-4 space-y-0 rounded-[1.25rem] border-2 p-5 transition-all cursor-pointer group",
                                                        isChecked ? "border-indigo-500 bg-indigo-50/30" : "border-slate-50 bg-slate-50/30 hover:border-slate-100"
                                                    )}>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, s.label])
                                                                        : field.onChange(field.value?.filter((v) => v !== s.label))
                                                                }}
                                                                className="h-6 w-6 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-sm font-black text-slate-700 cursor-pointer w-full group-hover:text-indigo-600 transition-colors">
                                                            {s.label}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Inputs */}
                            <input type="hidden" {...form.register('eventCity')} />
                            <input type="hidden" {...form.register('locationName')} />
                            <input type="hidden" {...form.register('eventProvince')} />
                            <input type="hidden" {...form.register('eventRegion')} />
                        </div>

                        <DialogFooter className="p-5 border-t border-slate-50 flex items-center justify-end shrink-0 gap-4 bg-slate-50/30">
                            <Button variant="ghost" onClick={() => setOpen(false)} type="button" className="font-bold text-slate-400 h-11 px-6 hover:bg-transparent hover:text-slate-600">Annulla</Button>
                            <Button type="submit" disabled={loading} className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-extrabold px-10 h-11 text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
