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

export const getAuthUrl = (state?: string) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/spreadsheets.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.send'
        ],
        prompt: 'consent select_account',
        ...(state ? { state } : {})
    });
};

export const sendGmail = async (tokens: any, { to, subject, body }: { to: string, subject: string, body: string }) => {
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    });
};

export const getUserInfo = async (tokens: any) => {
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data;
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
