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

    if (!tokens) {
        return { error: 'Not authenticated', authenticated: false };
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
                    timeMin: new Date().toISOString(),
                    maxResults: 15,
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
        let allEvents = allEventsResults.flat();

        // 3. Ordiniamo tutti gli eventi per data di inizio
        allEvents.sort((a, b) => {
            const dateA = new Date(a.start || 0).getTime();
            const dateB = new Date(b.start || 0).getTime();
            return dateA - dateB;
        });

        return {
            authenticated: true,
            calendars: calendarList.map(c => ({ id: c.id, summary: c.summary, primary: c.primary })),
            events: allEvents.slice(0, 30)
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return { error: 'Failed to fetch events', authenticated: false };
    }
}

export async function createCalendarEvent(eventData: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
}) {
    const tokens = await getGoogleTokens();
    if (!tokens) {
        return { success: false, error: 'Non connesso a Google Calendar' };
    }

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
        return { success: true, eventId: response.data.id };
    } catch (error: any) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: error.message };
    }
}
