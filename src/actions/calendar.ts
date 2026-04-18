'use server'

import { getGoogleCalendarClient } from "@/lib/google-auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { createActivity } from "./lead-detail";

async function getGoogleTokens(): Promise<any | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('PLATINUM_AUTH_SESSION');
    const tokenCookie = cookieStore.get('PLATINUM_G_SYNC') || cookieStore.get('google_tokens') || cookieStore.get('google_calendar_tokens');

    if (session) {
        try {
            const sessionData = JSON.parse(session.value);
            
            // 1. Prova dalla sessione (veloce)
            if (sessionData.googleTokens) {
                const tokens = JSON.parse(sessionData.googleTokens);
                if (tokens && (tokens.access_token || tokens.refresh_token)) return tokens;
            }

            // 2. Prova dal database con Prisma (Accesso dinamico per evitare blocchi TypeScript in build)
            const userEmail = sessionData.email?.toLowerCase().trim();
            if (userEmail) {
                const user = await (prisma.user as any).findUnique({
                    where: { email: userEmail }
                });
                
                if (user && user.googleTokens) {
                    return JSON.parse(user.googleTokens);
                }
            }
        } catch (e) {
            console.warn('[CALENDAR] Error reading tokens via Dynamic Prisma:', e);
        }
    }

    // 3. Fallback cookie separato
    if (tokenCookie) {
        try { 
            const tokens = JSON.parse(tokenCookie.value);
            if (tokens && (tokens.access_token || tokens.refresh_token)) return tokens;
        } catch (e) {}
    }

    return null;
}

export async function getCalendarEvents() {
    const tokens = await getGoogleTokens();

    const cookieStore = await cookies();
    const session = cookieStore.get('PLATINUM_AUTH_SESSION');
    let ownerId: string | null = null;
    let localAppointments: any[] = [];
    
        if (session) {
            try {
                const sessionData = JSON.parse(session.value);
                const userEmail = sessionData.email?.toLowerCase().trim();
                const users: any[] = await prisma.$queryRawUnsafe(
                    `SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
                    userEmail
                );
                ownerId = users.length > 0 ? users[0].id : null;

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
        let googleFetchFailed = false;
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
                googleFetchFailed = true; // Segnamo il fallimento per evitare cleanup errati
                return [];
            }
        });

        const allEventsResults = await Promise.all(eventPromises);
        let googleEvents = allEventsResults.flat();

        // 3. UNIAMO GLI EVENTI LOCALI E QUELLI DI GOOGLE
        const googleEventIdsFetched = new Set(googleEvents.map(ge => ge.id));
        
        // Identifichiamo eventuali appuntamenti locali che avevano un ID Google ma che ora non esistono più (cancellati da Google)
        // Facciamo il cleanup solo se la chiamata a Google è andata a buon fine al 100%
        const appointmentsToDelete = (!googleFetchFailed && localAppointments.length > 0) 
            ? localAppointments.filter(app => 
                app.googleEventId && 
                !googleEventIdsFetched.has(app.googleEventId) &&
                new Date(app.start) > new Date(new Date().setMonth(new Date().getMonth() - 3))
              )
            : [];

        if (appointmentsToDelete.length > 0) {
            const idsToDelete = appointmentsToDelete.map(a => a.id.replace('local-', ''));
            await prisma.appointment.deleteMany({
                where: { id: { in: idsToDelete } }
            });
            // Rimuoviamo dalla lista locale per la risposta immediata
            const deletedFullIds = new Set(appointmentsToDelete.map(a => a.id));
            localAppointments = localAppointments.filter(app => !deletedFullIds.has(app.id));
        }

        // Evitiamo duplicati se l'evento Google ha lo stesso googleEventId che abbiamo in locale
        const googleEventIdsInLocal = new Set(localAppointments
            .filter(a => a.googleEventId)
            .map(a => a.googleEventId));
            
        const uniqueGoogleEvents = googleEvents.filter(ge => !googleEventIdsInLocal.has(ge.id));
        
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
    let ownerId: string | null = null;

    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('PLATINUM_AUTH_SESSION');
        
        if (session) {
            const sessionData = JSON.parse(session.value);
            // 1. Priorità assoluta: l'id già presente nel cookie
            ownerId = sessionData.id || null;
            
            const userEmail = sessionData.email?.toLowerCase().trim();
            
            // 2. Backup: se l'ID non c'è nel cookie, lo cerchiamo nel DB
            if (!ownerId && userEmail) {
                const users: any[] = await prisma.$queryRawUnsafe(
                    `SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
                    userEmail
                );
                if (users.length > 0) ownerId = users[0].id;
            }
        }

        if (!ownerId) {
            console.error('[CALENDAR ERROR] No ownerId found even after fallback.');
            return { success: false, error: 'Identità utente non verificata nel database. Per favore effettua Logout e Login.' };
        }

        // SINCRONIZZAZIONE GOOGLE PURA
        const tokens = await getGoogleTokens();

        if (tokens) {
            try {
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

                const googleEventId = response.data.id;
                
                if (eventData.leadId && googleEventId) {
                    await createActivity(eventData.leadId, 'SYSTEM', `✓ Sincronizzato con Google Calendar (${googleEventId})`, undefined);
                }

                return { success: true, eventId: googleEventId };
            } catch (googleError: any) {
                console.error('Google Calendar Sync failed:', googleError);
                return { 
                    success: false, 
                    error: `Google Sync Error: ${googleError.message || 'Errore durante la creazione su Google'}`,
                };
            }
        } else {
            console.warn('Google Sync skipped: No tokens found');
            return { success: false, error: "Account Google non collegato" };
        }
    } catch (error: any) {
        console.error('Error in createCalendarEvent:', error);
        return { success: false, error: error.message };
    }
}
