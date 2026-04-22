'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google: any;
  }
}
import { Edit2, MapPin, Plus, Trash2, UserPlus, Info } from 'lucide-react'
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
    referents: z.array(z.object({
        role: z.string(),
        name: z.string()
    })).default([])
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

    // Parsing referents from stringified JSON
    let initialReferents = [];
    try {
        if ((lead as any).referents) {
            initialReferents = JSON.parse((lead as any).referents);
        }
    } catch (e) {
        console.error("Error parsing referents:", e);
    }

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
            referents: initialReferents,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "referents"
    });

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
                    if (!place.geometry) {
                        setStatusMessage("Seleziona un'opzione dall'elenco suggerito");
                        return;
                    }
                    setStatusMessage(null);
                    if (place.formatted_address) form.setValue('eventLocation', place.formatted_address);
                    if (place.name) form.setValue('locationName', place.name);

                    let city = '', province = '', region = '';
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            if (types.includes('locality')) city = component.long_name;
                            else if (!city && types.includes('administrative_area_level_3')) city = component.long_name;
                            if (types.includes('administrative_area_level_2')) province = component.short_name;
                            if (types.includes('administrative_area_level_1')) region = component.long_name;
                        }
                    }
                    form.setValue('eventCity', city, { shouldDirty: true });
                    form.setValue('eventProvince', province, { shouldDirty: true });
                    form.setValue('eventRegion', region, { shouldDirty: true });
                });
             }
        };

        if (!window.google) {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBOTQRShuod2e9ipkQ1FhR2nOJvASevr6k';
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.onload = () => initAutocomplete();
            document.head.appendChild(script);
        } else {
            setTimeout(initAutocomplete, 200);
        }
    }, [open, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const finalValues = {
                ...values,
                additionalServices: values.additionalServices.join(', '),
                referents: JSON.stringify(values.referents) // Convert to string for DB
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
            <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border border-slate-200/50 shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[95vh]">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 text-white relative h-28 flex flex-col justify-end shrink-0">
                    <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1 text-white">
                         Gestione Dati Lead
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 font-medium opacity-90 text-[11px]">
                        Perfeziona i dettagli dell'evento e aggiorna i referenti.
                    </DialogDescription>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6 custom-scrollbar pb-10">
                             
                             {/* Anagrafica e Referenti */}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dati Principali</h4>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nome</FormLabel>
                                                <FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cognome</FormLabel>
                                                <FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Telefono</FormLabel>
                                                    <FormControl><Input className="h-11 rounded-xl border-slate-100 bg-slate-50/50 font-bold" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* SEZIONE REFERENTI RICHIESTA DA LUCA */}
                                <div className="space-y-4 bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <UserPlus className="h-4 w-4 text-indigo-500" />
                                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Referenti</h4>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => append({ role: '', name: '' })}
                                            className="h-8 rounded-full bg-white border border-slate-100 text-indigo-600 font-bold text-[10px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> AGGIUNGI
                                        </Button>
                                    </div>

                                    {fields.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nessun referente aggiunto</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex-1 space-y-1">
                                                    <Input 
                                                        placeholder="es. Sposo" 
                                                        className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold"
                                                        {...form.register(`referents.${index}.role` as const)}
                                                    />
                                                </div>
                                                <div className="flex-[1.5] space-y-1">
                                                    <Input 
                                                        placeholder="Nome Referente" 
                                                        className="h-9 rounded-xl border-slate-200 bg-white text-[11px] font-bold"
                                                        {...form.register(`referents.${index}.name` as const)}
                                                    />
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => remove(index)}
                                                    className="h-9 w-9 rounded-xl text-rose-300 hover:text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-8 pt-4">
                                {/* Geolocalizzazione */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Location</h4>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="eventLocation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input 
                                                        className="rounded-xl border-2 border-slate-100 bg-slate-50/50 h-11 font-bold text-[11px]" 
                                                        placeholder="Cerca Location..." 
                                                        {...field}
                                                        ref={(e) => {
                                                            field.ref(e);
                                                            (inputRef as any).current = e;
                                                        }}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Città</p>
                                            <p className="text-[10px] font-black text-slate-800 truncate">{watchCity || '-'}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Prov</p>
                                            <p className="text-[10px] font-black text-slate-800 truncate">{watchProvince || '-'}</p>
                                        </div>
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2 text-center">
                                            <p className="text-[8px] font-bold text-indigo-500 uppercase">Regione</p>
                                            <p className="text-[10px] font-black text-slate-800 truncate">{watchRegion || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dettagli Evento */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-indigo-500" />
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Dettagli Evento</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="eventType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                        <FormControl><SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold text-[11px]"><SelectValue placeholder="Tipo..." /></SelectTrigger></FormControl>
                                                        <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="eventDate"
                                            render={({ field }) => (
                                                <FormItem><FormControl><Input type="date" className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold text-[11px]" {...field} /></FormControl></FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                         <FormField
                                            control={form.control}
                                            name="productInterest"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl><Input placeholder="Interesse Prodotto" className="h-11 rounded-xl bg-slate-50/50 border-slate-100 font-bold text-[11px]" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                             </div>

                             {/* Hidden Inputs per i valori della mappa Google */}
                             <input type="hidden" {...form.register('eventCity')} />
                             <input type="hidden" {...form.register('locationName')} />
                             <input type="hidden" {...form.register('eventProvince')} />
                             <input type="hidden" {...form.register('eventRegion')} />
                        </div>

                        <DialogFooter className="p-6 border-t border-slate-50 flex items-center justify-end shrink-0 gap-4 bg-slate-50/30">
                            <Button variant="ghost" onClick={() => setOpen(false)} type="button" className="font-bold text-slate-400 h-10 hover:bg-transparent">Annulla</Button>
                            <Button type="submit" disabled={loading} className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-extrabold px-10 h-10 text-[10px] uppercase tracking-widest shadow-xl transition-all">
                                {loading ? 'Salvataggio...' : 'Salva Tutte le Modifiche'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
