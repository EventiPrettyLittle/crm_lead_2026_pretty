"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
    Edit2, 
    Loader2, 
    MapPin, 
    User, 
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

const EVENT_TYPES = [
  'Matrimonio',
  'Comunione',
  'Battesimo',
  'Compleanno',
  'Diciottesimo',
  'Evento Aziendale',
  'Altro'
]

const SERVICES = [
  { id: 'musica', label: 'Musica' },
  { id: 'animazione', label: 'Animazione' },
  { id: 'allestimento', label: 'Allestimento Floreale' },
  { id: 'fotografo', label: 'Servizio Fotografico' },
  { id: 'bomboniere', label: 'Bomboniere' },
]

const formSchema = z.object({
  firstName: z.string().min(2, 'Nome troppo corto'),
  lastName: z.string().min(2, 'Cognome troppo corto'),
  email: z.string().optional().or(z.literal('')),
  phoneRaw: z.string().optional().or(z.literal('')),
  eventType: z.string().optional().or(z.literal('')),
  eventDate: z.string().optional().or(z.literal('')),
  eventLocation: z.string().optional().or(z.literal('')),
  locationName: z.string().optional().or(z.literal('')),
  eventCity: z.string().optional().or(z.literal('')),
  eventProvince: z.string().optional().or(z.literal('')),
  eventRegion: z.string().optional().or(z.literal('')),
  additionalServices: z.array(z.string()).default([]),
})

interface EditLeadDialogProps {
  lead: any
}

export function EditLeadDialog({ lead }: EditLeadDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const autoCompleteRef = useRef<any>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: lead.firstName || '',
            lastName: lead.lastName || '',
            email: lead.email || '',
            phoneRaw: lead.phoneRaw || '',
            eventType: lead.eventType || '',
            eventDate: lead.eventDate ? new Date(lead.eventDate).toISOString().split('T')[0] : '',
            eventLocation: lead.eventLocation || '',
            locationName: lead.locationName || '',
            eventCity: lead.eventCity || '',
            eventProvince: lead.eventProvince || '',
            eventRegion: lead.eventRegion || '',
            additionalServices: lead.additionalServices ? lead.additionalServices.split(', ') : [],
        },
    })

    const watchCity = form.watch('eventCity')
    const watchProvince = form.watch('eventProvince')
    const watchRegion = form.watch('eventRegion')

    useEffect(() => {
        if (!open) return;

        const initAutocomplete = () => {
            if (!inputRef.current || !(window as any).google) {
                setTimeout(initAutocomplete, 500);
                return;
            }

            try {
                autoCompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
                    types: ['establishment', 'geocode'],
                    componentRestrictions: { country: "it" },
                    fields: ["address_components", "formatted_address", "geometry", "name"]
                });

                autoCompleteRef.current.addListener("place_changed", () => {
                    const place = autoCompleteRef.current.getPlace();
                    if (!place || !place.geometry) return;

                    let city = '', province = '', region = '';
                    if (place.address_components) {
                        for (const component of place.address_components) {
                            const types = component.types;
                            if (types.includes('locality')) city = component.long_name;
                            if (types.includes('administrative_area_level_2')) province = component.short_name;
                            if (types.includes('administrative_area_level_1')) region = component.long_name;
                        }
                    }
                    
                    form.setValue('eventLocation', place.formatted_address || '', { shouldDirty: true });
                    form.setValue('locationName', place.name || '', { shouldDirty: true });
                    form.setValue('eventCity', city, { shouldDirty: true });
                    form.setValue('eventProvince', province, { shouldDirty: true });
                    form.setValue('eventRegion', region, { shouldDirty: true });
                });
            } catch (err) {
                console.error("Autocomplete Error:", err);
            }
        };

        initAutocomplete();
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
                toast.success('Dati salvati correttamente')
                router.refresh()
                setOpen(false)
            } else {
                toast.error('Errore: ' + (result as any).error)
            }
        } catch (error: any) {
            toast.error('Errore di sistema')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-2xl border-slate-200 hover:border-slate-400 group h-12 px-6 font-bold transition-all shadow-sm">
                    <Edit2 className="mr-2 h-4 w-4 text-slate-500 group-hover:scale-110 transition-transform" />
                    Modifica Dati
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-[3rem] border border-slate-200 shadow-2xl p-0 overflow-hidden bg-white max-h-[95vh] flex flex-col">
                <div className="bg-slate-950 p-8 text-white shrink-0 relative">
                    <DialogTitle className="text-3xl font-black tracking-tighter mb-1 uppercase">Gestione Lead</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium text-xs opacity-90 tracking-tight uppercase">Configurazione Evento e Geolocalizzazione</DialogDescription>
                    <div className="absolute top-8 right-8 bg-white/5 rounded-full h-12 w-12 flex items-center justify-center border border-white/10">
                        <User className="h-6 w-6 text-white" />
                    </div>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-10 pt-6 space-y-8">
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-slate-950" />
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Informazioni Cliente</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="firstName" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem><FormControl><Input placeholder="Nome" {...fieldProps} value={value || ''} className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="lastName" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem><FormControl><Input placeholder="Cognome" {...fieldProps} value={value || ''} className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" /></FormControl></FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="email" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem><FormControl><Input placeholder="Email" {...fieldProps} value={value || ''} className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="phoneRaw" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem><FormControl><Input placeholder="Telefono" {...fieldProps} value={value || ''} className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" /></FormControl></FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-50 pt-8">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-slate-950" />
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Configurazione Evento</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <FormField control={form.control} name="eventType" render={({ field }) => (
                                    <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Scegli..." /></SelectTrigger></FormControl>
                                        <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )} />
                                <FormField control={form.control} name="eventDate" render={({ field: { value, ...fieldProps } }) => (
                                    <FormItem><FormControl><Input type="date" {...fieldProps} value={value || ''} className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold" /></FormControl></FormItem>
                                )} />
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-slate-50 pt-8">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="h-4 w-1 rounded-full bg-slate-400" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Geolocalizzazione</h3>
                            </div>
                             <FormField control={form.control} name="eventLocation" render={({ field: { value, ...fieldProps } }) => (
                                <FormItem><FormControl><div className="relative">
                                    <Input 
                                        {...fieldProps} 
                                        value={value || ''}
                                        ref={(e) => { 
                                            fieldProps.ref(e); 
                                            (inputRef as any).current = e; 
                                        }} 
                                        className="h-16 rounded-2xl pl-12 border-2 border-slate-100 bg-white font-bold text-slate-950 shadow-xl focus:border-slate-800 transition-all placeholder:text-slate-300" 
                                        placeholder="Cerca Villa o Indirizzo..." 
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                                </div></FormControl></FormItem>
                            )} />
                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Città</p><p className="text-[11px] font-black text-slate-900">{watchCity || '-'}</p></div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Prov</p><p className="text-[11px] font-black text-slate-900">{watchProvince || '-'}</p></div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Regione</p><p className="text-[11px] font-black text-slate-900">{watchRegion || '-'}</p></div>
                            </div>
                        </div>

                        <div className="pt-2">
                             <Button type="submit" disabled={loading} className="w-full h-16 rounded-[1.8rem] bg-slate-950 hover:bg-black text-white font-black uppercase tracking-[0.15em] shadow-2xl shadow-slate-200 transition-all active:scale-95">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sincronizza e Salva Modifiche'}
                             </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
