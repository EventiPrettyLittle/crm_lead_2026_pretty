import { google } from 'googleapis';

const getEnvVar = (name: string) => {
    const value = process.env[name];
    if (!value) {
        console.warn(`Warning: Environment variable ${name} is not set.`);
    }
    return value || '';
};

const oauth2Client = new google.auth.OAuth2(
    getEnvVar('GOOGLE_CLIENT_ID'),
    getEnvVar('GOOGLE_CLIENT_SECRET'),
    getEnvVar('GOOGLE_REDIRECT_URI')
);

export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/spreadsheets.readonly'
        ],
        prompt: 'consent'
    });
};

export const getTokens = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

export const getGoogleCalendarClient = (tokens: any) => {
    oauth2Client.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getGoogleSheetsClient = (tokens: any) => {
    oauth2Client.setCredentials(tokens);
    return google.sheets({ version: 'v4', auth: oauth2Client });
};
