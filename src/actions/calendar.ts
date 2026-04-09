'use server'

import { getGoogleCalendarClient } from "@/lib/google-auth";
import { cookies } from "next/headers";

async function getGoogleTokens(): Promise<any | null> {
    // 1. Prima prova dal DB (fonte primaria - non si perde mai)
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('user_session');
        if (session) {
            const sessionData = JSON.parse(session.value);
            const prisma = (await import("@/lib/prisma")).default;
            const users: any[] = await prisma.$queryRawUnsafe(
                `SELECT "googleTokens" FROM "User" WHERE email = $1 LIMIT 1`,
                sessionData.email
            );
            if (users.length > 0 && users[0].googleTokens) {
                return JSON.parse(users[0].googleTokens);
            }
        }
    } catch (e) {
        console.warn('Could not read tokens from DB, falling back to cookie:', e);
    }

    // 2. Fallback: leggi dal cookie
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('google_tokens') || cookieStore.get('google_calendar_tokens');
    if (tokenCookie) {
        try { return JSON.parse(tokenCookie.value); } catch { return null; }
    }
    return null;
}

export async function getCalendarEvents() {
    const tokens = await getGoogleTokens();

    const prisma = (await import("@/lib/prisma")).default;
    const cookieStore = await cookies();
    const session = cookieStore.get('user_session');
    let ownerId: string | null = null;
    let localAppointments: any[] = [];
    
    if (session) {
        try {
            const sessionData = JSON.parse(session.value);
            const user = await prisma.user.findUnique({ where: { email: sessionData.email } });
            ownerId = user?.id || null;

            if (ownerId) {
                // RECUPERO APPUNTAMENTI DAL DATABASE CRM
                const apps = await prisma.appointment.findMany({
                    where: { ownerId: ownerId },
                    include: { lead: true },
                    orderBy: { startTime: 'asc' }
                });
                localAppointments = apps.map(app => ({
                    id: `local-${app.id}`,
                    title: app.title || `App. ${app.lead.firstName}`,
                    start: app.startTime.toISOString(),
                    end: new Date(app.startTime.getTime() + app.duration * 60000).toISOString(),
                    location: app.location,
                    description: app.notes,
                    calendarName: 'CRM Interno',
                    calendarColor: '#4f46e5', // Colore indigo per distinguere
                    leadId: app.leadId,
                    googleEventId: app.googleEventId
                }));
            }
        } catch (e) {
            console.error("Error fetching local appointments:", e);
        }
    }

    if (!tokens) {
        // Se non è connesso a Google, mostriamo almeno quelli locali
        return { 
            authenticated: false, 
            events: localAppointments,
            calendars: [{ id: 'crm-local', summary: 'CRM Interno', primary: true }] 
        };
    }

    try {
        const calendar = getGoogleCalendarClient(tokens);

        // 1. Recuperiamo la lista dei calendari dell'utente
        const calendarListResponse = await calendar.calendarList.list();
        const calendarList = calendarListResponse.data.items || [];

        // 2. Recuperiamo gli eventi da TUTTI i calendari (parallelo)
        const eventPromises = calendarList.map(async (cal) => {
            try {
                const res = await calendar.events.list({
                    calendarId: cal.id || 'primary',
                    timeMin: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
                    maxResults: 250,
                    singleEvents: true,
                    orderBy: 'startTime',
                });
                return (res.data.items || []).map(event => ({
                    id: event.id,
                    title: event.summary,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                    location: event.location,
                    description: event.description,
                    calendarName: cal.summary,
                    calendarColor: cal.backgroundColor
                }));
            } catch (e) {
                console.error(`Error fetching events for calendar ${cal.id}:`, e);
                return [];
            }
        });

        const allEventsResults = await Promise.all(eventPromises);
        let googleEvents = allEventsResults.flat();

        // 3. UNIAMO GLI EVENTI LOCALI E QUELLI DI GOOGLE
        // Evitiamo duplicati se l'evento Google ha lo stesso googleEventId che abbiamo salvato in locale
        const googleEventIdsInLocal = localAppointments
            .filter(a => a.googleEventId)
            .map(a => a.googleEventId);
            
        const uniqueGoogleEvents = googleEvents.filter(ge => !googleEventIdsInLocal.includes(ge.id));
        
        const allEvents = [...localAppointments, ...uniqueGoogleEvents];

        // 4. Ordiniamo tutti gli eventi per data di inizio
        allEvents.sort((a, b) => {
            const dateA = new Date(a.start || 0).getTime();
            const dateB = new Date(b.start || 0).getTime();
            return dateA - dateB;
        });

        return {
            authenticated: true,
            calendars: calendarList.map(c => ({ id: c.id, summary: c.summary, primary: c.primary })),
            events: allEvents
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return { 
            error: 'Failed to fetch Google events', 
            authenticated: true, // we still have local ones
            events: localAppointments 
        };
    }
}

export async function createCalendarEvent(eventData: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    leadId?: string;
}) {
    const tokens = await getGoogleTokens();
    if (!tokens) {
        return { success: false, error: 'Non connesso a Google Calendar' };
    }

    try {
        const prisma = (await import("@/lib/prisma")).default;
        const cookieStore = await cookies();
        const session = cookieStore.get('user_session');
        let ownerId: string | null = null;
        
        if (session) {
            const sessionData = JSON.parse(session.value);
            const user = await prisma.user.findUnique({ where: { email: sessionData.email } });
            ownerId = user?.id || null;
        }

        const calendar = getGoogleCalendarClient(tokens);
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: eventData.title,
                description: eventData.description,
                location: eventData.location,
                start: { dateTime: eventData.startDateTime, timeZone: 'Europe/Rome' },
                end: { dateTime: eventData.endDateTime, timeZone: 'Europe/Rome' },
            },
        });

        // SALVATAGGIO NEL DATABASE LOCALE CRM
        if (ownerId && eventData.leadId) {
            const start = new Date(eventData.startDateTime);
            const end = new Date(eventData.endDateTime);
            const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

            await prisma.appointment.create({
                data: {
                    title: eventData.title,
                    notes: eventData.description,
                    location: eventData.location,
                    startTime: start,
                    duration: duration,
                    leadId: eventData.leadId,
                    ownerId: ownerId,
                    googleEventId: response.data.id || null
                }
            });
        }

        return { success: true, eventId: response.data.id };
    } catch (error: any) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: error.message };
    }
}
