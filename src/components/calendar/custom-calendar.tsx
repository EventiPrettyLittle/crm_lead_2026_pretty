'use client'

import { useState, useEffect } from 'react'
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays, 
    startOfDay, 
    parseISO,
    eachDayOfInterval,
    isToday,
    addWeeks,
    subWeeks
} from 'date-fns'
import { it } from 'date-fns/locale'
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    Settings, 
    Plus, 
    LayoutGrid, 
    LayoutList, 
    Calendar as CalendarIcon,
    MoreHorizontal,
    MapPin,
    Clock,
    RefreshCcw,
    X,
    ExternalLink,
    Phone,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { getCalendarEvents, createCalendarEvent } from '@/actions/calendar'
import { searchLeadsGlobal } from '@/actions/search-leads'
import { toast } from 'sonner'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ViewType = 'month' | 'week' | 'day'

export default function PremiumCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewType>('month')
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    
    // Form state per nuovo evento
    const [formData, setFormData] = useState({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        duration: '60',
        location: '',
        description: '',
        leadId: ''
    })
    const [leadSearch, setLeadSearch] = useState('')
    const [leadResults, setLeadResults] = useState<any[]>([])
    const [selectedLead, setSelectedLead] = useState<any | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const loadEvents = async () => {
        setLoading(true)
        try {
            const result = await getCalendarEvents()
            if (result.authenticated !== undefined) {
                setIsAuthenticated(result.authenticated)
                setEvents(result.events || [])
            }
        } catch (error) {
            console.error("Calendar load error:", error)
            toast.error("Errore nel caricamento eventi")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEvents()
    }, [])

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (leadSearch.length >= 2) {
                setIsSearching(true)
                const results = await searchLeadsGlobal(leadSearch)
                setLeadResults(results as any[])
                setIsSearching(false)
            } else {
                setLeadResults([])
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [leadSearch])

    const handleCreateEvent = async () => {
        if (!formData.title || !formData.date || !formData.leadId) {
            toast.error("Titolo, data e lead sono obbligatori")
            return
        }

        setIsSaving(true)
        try {
            const startDateTime = `${formData.date}T${formData.time}:00`
            const startDate = new Date(startDateTime)
            const endDate = new Date(startDate.getTime() + (parseInt(formData.duration) * 60000))
            
            const result = await createCalendarEvent({
                title: formData.title,
                description: formData.description,
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
                location: formData.location,
                leadId: formData.leadId
            })

            if (result.success) {
                toast.success("Evento creato con successo")
                setIsCreateModalOpen(false)
                setFormData({
                    title: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    time: '10:00',
                    duration: '60',
                    location: '',
                    description: '',
                    leadId: ''
                })
                setSelectedLead(null)
                loadEvents()
            } else {
                toast.error(result.error || "Errore creazione evento")
            }
        } catch (error) {
            toast.error("Impossibile creare l'evento")
        } finally {
            setIsSaving(false)
        }
    }

    const next = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, 1))
    }

    const prev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
        else setCurrentDate(addDays(currentDate, -1))
    }

    const setToday = () => setCurrentDate(new Date())

    const handleDayClick = (day: Date) => {
        setCurrentDate(day)
        setView('day')
    }

    // UI Renders
    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">Calendar</span>
                    </div>

                    <Button 
                        variant="outline" 
                        onClick={setToday}
                        className="rounded-xl border-slate-200 font-bold text-xs h-9 uppercase tracking-widest hover:bg-slate-50"
                    >
                        Oggi
                    </Button>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={prev} className="rounded-full h-8 w-8 text-slate-600">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={next} className="rounded-full h-8 w-8 text-slate-600">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    <h2 className="text-lg font-black text-slate-800 capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: it })}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl mr-4">
                        {(['month', 'week', 'day'] as ViewType[]).map((v) => (
                            <Button
                                key={v}
                                variant="ghost"
                                size="sm"
                                onClick={() => setView(v)}
                                className={cn(
                                    "rounded-xl px-4 py-1.5 min-w-[80px] text-[10px] font-black uppercase tracking-widest transition-all",
                                    view === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {v === 'month' ? 'Mese' : v === 'week' ? 'Settimana' : 'Giorno'}
                            </Button>
                        ))}
                    </div>

                    <Button variant="ghost" size="icon" onClick={loadEvents} disabled={loading} className="rounded-full text-slate-500 hover:bg-slate-50">
                        <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </Button>
                    
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-10 px-6 font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-indigo-100 transition-transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuovo Evento
                    </Button>
                </div>
            </div>
        )
    }

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

        const days = eachDayOfInterval({ start: startDate, end: endDate })
        const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {weekdays.map(d => (
                        <div key={d} className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 overflow-auto">
                    {days.map((day, i) => {
                        const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day))
                        return (
                            <div 
                                key={day.toString()} 
                                className={cn(
                                    "min-h-[120px] border-r border-b border-slate-50 p-2 transition-colors hover:bg-slate-50/50 flex flex-col gap-1",
                                    !isSameMonth(day, monthStart) && "bg-slate-50/30 text-slate-400 opacity-50"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <span 
                                        onClick={() => handleDayClick(day)}
                                        className={cn(
                                            "text-xs font-black h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer hover:bg-slate-100",
                                            isToday(day) ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600"
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {dayEvents.slice(0, 4).map((event, idx) => (
                                        <div 
                                            key={event.id || idx}
                                            onClick={() => setSelectedEvent(event)}
                                            className="text-[9px] font-bold px-2 py-1 rounded-lg truncate cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-1"
                                            style={{ 
                                                backgroundColor: event.calendarColor || '#eef2ff',
                                                color: '#1e1b4b',
                                                borderLeft: `3px solid ${event.calendarColor ? 'rgba(0,0,0,0.1)' : '#4f46e5'}`
                                            }}
                                        >
                                            <span className="opacity-70">{format(parseISO(event.start), 'HH:mm')}</span>
                                            <span className="truncate">{event.title}</span>
                                        </div>
                                    ))}
                                    {dayEvents.length > 4 && (
                                        <div 
                                            onClick={() => handleDayClick(day)}
                                            className="text-[9px] font-black text-indigo-500 px-2 mt-1 uppercase tracking-tighter cursor-pointer hover:underline"
                                        >
                                            + {dayEvents.length - 4} altri
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
        const hours = Array.from({ length: 24 }, (_, i) => i)

        return (
            <div className="flex flex-col h-full bg-white overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <div className="w-16 border-r border-slate-100" />
                    {weekDays.map(day => (
                        <div key={day.toString()} className="flex-1 py-4 flex flex-col items-center gap-1 border-r border-slate-50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {format(day, 'EEE', { locale: it })}
                            </span>
                            <span 
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "text-lg font-black h-10 w-10 flex items-center justify-center rounded-xl transition-all cursor-pointer",
                                    isToday(day) ? "bg-indigo-600 text-white shadow-lg" : "text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                {format(day, 'd')}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-auto flex">
                    <div className="w-16 shrink-0 bg-slate-50/50">
                        {hours.map(h => (
                            <div key={h} className="h-20 text-[10px] font-black text-slate-400 text-right pr-4 pt-2 uppercase tracking-tighter border-b border-slate-100/50">
                                {h}:00
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 relative h-[1920px]">
                        {hours.map(h => (
                            <div key={`line-${h}`} className="absolute w-full border-t border-slate-100 pointer-events-none" style={{ top: `${h * 80}px` }} />
                        ))}
                        {weekDays.map((day, dIdx) => {
                            const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day))
                            return (
                                <div key={day.toString()} className="relative border-r border-slate-50 h-[1920px]">
                                    {dayEvents.map((event, eIdx) => {
                                        const startDate = parseISO(event.start)
                                        const startMin = startDate.getHours() * 60 + startDate.getMinutes()
                                        return (
                                            <div 
                                                key={event.id || eIdx}
                                                onClick={() => setSelectedEvent(event)}
                                                className="absolute inset-x-1.5 p-2 rounded-xl text-[10px] font-bold shadow-sm border border-black/5 flex flex-col gap-0.5 cursor-pointer hover:shadow-md transition-all group overflow-hidden"
                                                style={{ 
                                                    top: `${(startMin / 60) * 80}px`, 
                                                    height: `80px`,
                                                    backgroundColor: event.calendarColor || '#e0e7ff',
                                                    color: '#1e1b4b',
                                                    borderLeft: `4px solid ${event.calendarColor ? 'rgba(0,0,0,0.2)' : '#4338ca'}`
                                                }}
                                            >
                                                <span className="text-[9px] opacity-70">{format(startDate, 'HH:mm')}</span>
                                                <span className="truncate leading-tight font-black">{event.title}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const dayEvents = events.filter(e => isSameDay(parseISO(e.start), currentDate))

        return (
            <div className="flex h-full bg-white overflow-hidden">
                <div className="w-20 shrink-0 border-r border-slate-100 bg-slate-50/30 flex flex-col pt-20">
                    {hours.map(h => (
                        <div key={h} className="h-20 text-[10px] font-black text-slate-400 text-right pr-4 pt-2 uppercase tracking-tighter">
                            {h}:00
                        </div>
                    ))}
                </div>
                <div className="flex-1 relative overflow-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 py-6 px-8 flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">
                            {format(currentDate, 'EEEE', { locale: it })}
                        </span>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {format(currentDate, 'd MMMM', { locale: it })}
                        </h3>
                    </div>
                    <div className="relative h-[1920px] px-4">
                        {hours.map(h => (
                            <div key={`line-${h}`} className="absolute w-full border-t border-slate-100 pointer-events-none" style={{ top: `${h * 80}px` }} />
                        ))}
                        {dayEvents.map((event, idx) => {
                            const startDate = parseISO(event.start)
                            const startMin = startDate.getHours() * 60 + startDate.getMinutes()
                            return (
                                <div 
                                    key={event.id || idx}
                                    onClick={() => setSelectedEvent(event)}
                                    className="absolute inset-x-8 p-4 rounded-[2rem] text-sm font-bold shadow-xl border border-black/5 flex flex-col gap-1 cursor-pointer hover:scale-[1.01] transition-all group overflow-hidden"
                                    style={{ 
                                        top: `${(startMin / 60) * 80}px`, 
                                        height: `100px`,
                                        backgroundColor: event.calendarColor || '#e0e7ff',
                                        color: '#1e1b4b',
                                        borderLeft: `6px solid ${event.calendarColor ? 'rgba(0,0,0,0.2)' : '#4338ca'}`
                                    }}
                                >
                                    <div className="flex items-center gap-2 opacity-70 mb-1">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{format(startDate, 'HH:mm')}</span>
                                    </div>
                                    <span className="text-lg font-black leading-tight tracking-tight">{event.title}</span>
                                    {event.location && (
                                        <div className="flex items-center gap-1.5 opacity-60 text-[11px] mt-1 font-bold">
                                            <MapPin className="w-3 h-3" />
                                            {event.location}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    if (isAuthenticated === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] bg-indigo-50/30 p-12 text-center space-y-6">
                <div className="p-6 rounded-[2rem] bg-white shadow-xl shadow-indigo-100">
                    <CalendarIcon className="w-16 h-16 text-indigo-600" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">Connetti Google Calendar</h3>
                    <p className="text-indigo-600/70 max-w-sm mx-auto text-sm font-bold">
                        Sincronizza i tuoi appuntamenti per vederli qui.
                    </p>
                </div>
                <Button 
                    onClick={() => window.location.href = '/api/auth/google/login'} 
                    size="lg" 
                    className="gap-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 shadow-2xl shadow-indigo-600/30 font-black text-sm uppercase tracking-widest"
                >
                    Connetti Google
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden flex flex-col h-[85vh]">
            {renderHeader()}
            <div className="flex-1 overflow-hidden relative">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Sincronizzazione...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-w-md">
                    <div className="h-32 bg-indigo-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-700 opacity-90" />
                        <Sparkles className="absolute top-4 right-4 text-white/20 h-24 w-24" />
                        <button 
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="p-8 -mt-10 bg-white rounded-t-[2.5rem] relative">
                        <div className="flex flex-col gap-6">
                            <div className="space-y-1">
                                <Badge className={cn(
                                    "font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border-indigo-100"
                                )}>
                                    {selectedEvent?.calendarName || 'Evento'}
                                </Badge>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight mt-2">
                                    {selectedEvent?.title}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Orario</p>
                                        <p className="font-extrabold text-slate-700 text-sm">
                                            {selectedEvent?.start && format(parseISO(selectedEvent.start), 'd MMMM yyyy, HH:mm', { locale: it })}
                                        </p>
                                    </div>
                                </div>

                                {selectedEvent?.location && (
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                                        <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Luogo</p>
                                            <p className="font-extrabold text-slate-700 text-sm truncate uppercase tracking-tighter">
                                                {selectedEvent.location}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedEvent?.description && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note / Descrizione</Label>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed italic">
                                        {selectedEvent.description}
                                    </div>
                                </div>
                            )}

                            {selectedEvent?.leadId && (
                                <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-slate-200">
                                    <Link href={`/leads/${selectedEvent.leadId}`}>
                                        <ExternalLink className="w-5 h-5 text-indigo-400" />
                                        Vedi Scheda Lead
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Event Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-w-2xl bg-white">
                    <div className="p-8 space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nuovo Appuntamento</DialogTitle>
                            <DialogDescription>Compila i dettagli per registrare l'impegno sul CRM e caricarlo su Google Calendar.</DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Associa Lead (Obbligatorio)</Label>
                                {selectedLead ? (
                                    <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                                                {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                                            </div>
                                            <span className="font-bold text-slate-700">{selectedLead.firstName} {selectedLead.lastName}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => {setSelectedLead(null); setFormData({...formData, leadId: ''})}} className="text-slate-400 hover:text-red-500">
                                            Cambia
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            placeholder="Cerca lead per nome, email o telefono..." 
                                            className="pl-12 rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-medium"
                                            value={leadSearch}
                                            onChange={(e) => setLeadSearch(e.target.value)}
                                        />
                                        {leadResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-auto p-2">
                                                {leadResults.map(l => (
                                                    <div 
                                                        key={l.id} 
                                                        onClick={() => {
                                                            setSelectedLead(l);
                                                            setFormData({...formData, leadId: l.id});
                                                            setLeadResults([]);
                                                            setLeadSearch('');
                                                        }}
                                                        className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                                    >
                                                        <p className="text-sm font-bold text-slate-700">{l.firstName} {l.lastName}</p>
                                                        <p className="text-[10px] text-slate-400">{l.email || l.phoneRaw}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <RefreshCcw className="w-4 h-4 animate-spin text-indigo-400" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titolo Evento</Label>
                                <Input 
                                    className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold" 
                                    placeholder="ES: Chiamata conoscitiva, Visita Showroom..." 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</Label>
                                <Input 
                                    type="date" 
                                    className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold" 
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ora</Label>
                                    <Input 
                                        type="time" 
                                        className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold" 
                                        value={formData.time}
                                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durata (min)</Label>
                                    <Input 
                                        type="number" 
                                        className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold" 
                                        value={formData.duration}
                                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Luogo / Location</Label>
                                <Input 
                                    className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold" 
                                    placeholder="ES: Sede Napoli, Videochiamata Zoom..." 
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Note Attività</Label>
                                <Textarea 
                                    className="rounded-2xl border-slate-100 bg-slate-50 min-h-[80px] p-4 text-sm font-medium" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
                            >
                                Annulla
                            </Button>
                            <Button 
                                onClick={handleCreateEvent}
                                disabled={isSaving}
                                className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100"
                            >
                                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Crea e Sincronizza"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

}
