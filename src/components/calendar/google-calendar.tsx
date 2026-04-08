'use client'

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getCalendarEvents } from '@/actions/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ExternalLink, RefreshCcw, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GoogleCalendar() {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());

    const loadEvents = async () => {
        setLoading(true);
        const result = await getCalendarEvents();
        if (result.authenticated) {
            setIsAuthenticated(true);
            setEvents(result.events || []);
            setCalendars(result.calendars || []);
        } else {
            setIsAuthenticated(false);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleConnect = () => {
        window.location.href = '/api/auth/google/login';
    };

    if (isAuthenticated === false) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-xl bg-muted/30 p-8 text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10 transition-transform hover:scale-110 duration-500">
                    <CalendarIcon className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold uppercase tracking-tight">Connetti Google Calendar</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium">
                        Sincronizza i tuoi appuntamenti e ricontatti per non perdere neanche una chiamata.
                    </p>
                </div>
                <Button onClick={handleConnect} size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-2xl px-8 shadow-xl shadow-indigo-100">
                    <ExternalLink className="w-4 h-4" />
                    Connetti Account Google
                </Button>
            </div>
        );
    }

    const eventsOnSelectedDate = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Calendario</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={loadEvents} disabled={loading} className="hover:bg-indigo-50">
                            <RefreshCcw className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/api/auth/google/logout'} title="Scollega Account" className="hover:bg-red-50 text-red-500">
                            <ExternalLink className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent className="p-2">
                        <Calendar
                            onChange={(d: any) => setDate(d)}
                            value={date}
                            className="w-full border-none rounded-2xl p-2 font-sans"
                            tileContent={({ date: d, view }) => {
                                if (view === 'month') {
                                    const hasEvent = events.some(e => new Date(e.start).toDateString() === d.toDateString());
                                    return hasEvent ? <div className="h-1 w-1 bg-indigo-600 mx-auto rounded-full mt-1" /> : null;
                                }
                                return null;
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Lista dei Calendari Sincronizzati */}
                <Card className="border-none shadow-sm bg-indigo-950 text-white rounded-3xl overflow-hidden p-6 relative">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                         <CalendarIcon className="h-16 w-16" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-4">Sorgenti Attive ({calendars.length})</h4>
                    <div className="space-y-3">
                        {calendars.length === 0 ? (
                            <p className="text-xs text-indigo-400 font-bold italic">Nessun calendario trovato.</p>
                        ) : (
                            calendars.map(cal => (
                                <div key={cal.id} className="flex items-center gap-2 group cursor-default">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.3)]",
                                        cal.primary ? "bg-emerald-400" : "bg-indigo-400"
                                    )} />
                                    <span className="text-xs font-bold tracking-tight truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                        {cal.summary}
                                        {cal.primary && <span className="ml-2 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">(Main)</span>}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <Card className="md:col-span-3 border-none shadow-sm bg-white/80 backdrop-blur-md rounded-[2.5rem]">
                <CardHeader className="pb-2 border-b border-slate-100 mx-6 px-0 mt-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900 tracking-tight">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                            <CalendarIcon className="h-4 w-4" />
                        </div>
                        Impegni per il {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {eventsOnSelectedDate.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <RefreshCcw className="h-10 w-10 mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Nessun impegno programmato per oggi.</p>
                            </div>
                        ) : (
                            eventsOnSelectedDate.map(event => (
                                <div key={event.id} className="flex items-start gap-4 p-5 rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group/ev">
                                    <div className="min-w-24 pt-1">
                                        <div className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none">
                                            {new Date(event.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Inizio</div>
                                    </div>
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <h4 className="font-black text-slate-900 tracking-tight truncate text-base">{event.title}</h4>
                                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0">
                                                {event.calendarName || 'Google Calendar'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-4 pt-1">
                                            {event.location && (
                                                <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                                                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {event.location}
                                                </p>
                                            )}
                                            {event.description && (
                                                <p className="text-[11px] text-slate-500 font-medium line-clamp-2 italic opacity-80">{event.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
