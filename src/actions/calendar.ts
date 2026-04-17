'use server'

import { getGoogleCalendarClient } from "@/lib/google-auth";
import { cookies } from "next/headers";

async function getGoogleTokens(): Promise<any | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('user_session');
    const tokenCookie = cookieStore.get('google_tokens') || cookieStore.get('google_calendar_tokens');

    // 1. Prova dal cookie prima (più veloce e aggiornato nella sessione corrente)
    if (tokenCookie) {
        try { 
            const tokens = JSON.parse(tokenCookie.value);
            if (tokens && (tokens.access_token || tokens.refresh_token)) return tokens;
        } catch (e) {
            console.warn('Error parsing tokens from cookie:', e);
        }
    }

    // 2. Fonte di backup: Database (per permanenza)
    if (session) {
        try {
            const sessionData = JSON.parse(session.value);
            const prisma = (await import("@/lib/prisma")).default;
            const users: any[] = await prisma.$queryRawUnsafe(
                `SELECT "googleTokens" FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
                sessionData.email.toLowerCase()
            );
            if (users.length > 0 && users[0].googleTokens) {
                return JSON.parse(users[0].googleTokens);
            }
        } catch (e) {
            console.warn('Could not read tokens from DB:', e);
        }
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
    const prisma = (await import("@/lib/prisma")).default;

    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('user_session');

        if (session) {
            const sessionData = JSON.parse(session.value);
            const userEmail = sessionData.email?.toLowerCase().trim();
            const users: any[] = await prisma.$queryRawUnsafe(
                `SELECT id FROM "User" WHERE LOWER(email) = $1 LIMIT 1`,
                userEmail
            );
            ownerId = users.length > 0 ? users[0].id : null;
        }

        if (!ownerId) {
            return { success: false, error: 'Sessione utente non trovata' };
        }

        // 1. PREVENZIONE DOPPIONI / RECUPERO SINCRONIZZAZIONE
        let localAppointmentId = "";
        if (eventData.leadId) {
            const startTime = new Date(eventData.startDateTime);
            const existing = await prisma.appointment.findFirst({
                where: {
                    leadId: eventData.leadId,
                    startTime: {
                        gte: new Date(startTime.getTime() - 60000),
                        lte: new Date(startTime.getTime() + 60000)
                    }
                }
            });

            // Se l'appuntamento esiste già ed è già sincronizzato con Google, saltiamo tutto
            if (existing && existing.googleEventId) {
                return { success: true, eventId: existing.googleEventId, updated: true };
            }
            
            // Se esiste già localmente ma NON su Google, usiamo questo ID per l'update successivo
            if (existing) {
                localAppointmentId = existing.id;
            }
        }

        // 2. SALVATAGGIO LOCALE (Solo se non esisteva già)
        if (!localAppointmentId && eventData.leadId) {
            const start = new Date(eventData.startDateTime);
            const end = new Date(eventData.endDateTime);
            const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

            const app = await prisma.appointment.create({
                data: {
                    title: eventData.title,
                    notes: eventData.description,
                    location: eventData.location,
                    startTime: start,
                    duration: duration,
                    leadId: eventData.leadId,
                    ownerId: ownerId,
                }
            });
            localAppointmentId = app.id;
        }

        // 3. SINCRONIZZAZIONE GOOGLE (Ottimizzata)
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
                
                if (localAppointmentId && googleEventId) {
                    await prisma.appointment.update({
                        where: { id: localAppointmentId },
                        data: { googleEventId }
                    });
                }

                if (eventData.leadId) {
                    const { createActivity } = await import("./lead-detail");
                    await createActivity(eventData.leadId, 'SYSTEM', `✓ Sincronizzato con Google Calendar (${googleEventId})`, undefined);
                }

                return { success: true, eventId: googleEventId };
            } catch (googleError: any) {
                console.error('Google Calendar Sync failed:', googleError);
                if (eventData.leadId) {
                    const { createActivity } = await import("./lead-detail");
                    await createActivity(eventData.leadId, 'SYSTEM', `⚠ Errore Google Calendar: ${googleError.message || 'Sincronizzazione fallita'}`, undefined);
                }
                return { 
                    success: false, 
                    error: `Google Error: ${googleError.message || 'Errore durante la creazione dell\'evento'}`,
                    keepLocal: true 
                };
            }
        } else {
            console.warn('Google Sync skipped: No tokens found for user');
            if (eventData.leadId) {
                const { createActivity } = await import("./lead-detail");
                await createActivity(eventData.leadId, 'SYSTEM', "⚠ Google Calendar non collegato. L'appuntamento è solo locale.", undefined);
            }
            return { success: false, error: "Account Google non collegato o sessione scaduta" };
        }
    } catch (error: any) {
        console.error('Error in createCalendarEvent:', error);
        return { success: false, error: error.message };
    }
}
