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

export const sendGmail = async (tokens: any, { to, subject, body, attachment }: { to: string, subject: string, body: string, attachment?: { filename: string, content: Buffer } }) => {
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const boundary = "antigravity_boundary_" + Math.random().toString(36).substring(7);
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    let messageParts = [
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        body,
        ''
    ];

    if (attachment) {
        messageParts.push(
            `--${boundary}`,
            `Content-Type: application/pdf; name="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            '',
            attachment.content.toString('base64'),
            ''
        );
    }

    messageParts.push(`--${boundary}--`);
    const message = messageParts.join('\r\n');

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
    const client = new google.auth.OAuth2(
        getEnvVar('GOOGLE_CLIENT_ID'),
        getEnvVar('GOOGLE_CLIENT_SECRET'),
        getEnvVar('GOOGLE_REDIRECT_URI')
    );
    client.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: client });
};

export const getGoogleSheetsClient = (tokens: any) => {
    const client = new google.auth.OAuth2(
        getEnvVar('GOOGLE_CLIENT_ID'),
        getEnvVar('GOOGLE_CLIENT_SECRET'),
        getEnvVar('GOOGLE_REDIRECT_URI')
    );
    client.setCredentials(tokens);
    return google.sheets({ version: 'v4', auth: client });
};
