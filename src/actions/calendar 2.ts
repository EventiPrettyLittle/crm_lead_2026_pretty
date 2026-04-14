'use server'

import { getGoogleCalendarClient } from "@/lib/google-auth";
import { cookies } from "next/headers";

export async function getCalendarEvents() {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('google_calendar_tokens');

    if (!tokenCookie) {
        return { error: 'Not authenticated', authenticated: false };
    }

    try {
        const tokens = JSON.parse(tokenCookie.value);
        const calendar = getGoogleCalendarClient(tokens);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        return {
            authenticated: true,
            events: events.map(event => ({
                id: event.id,
                title: event.summary,
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
                location: event.location,
                description: event.description,
            }))
        };
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return { error: 'Failed to fetch events', authenticated: true };
    }
}
