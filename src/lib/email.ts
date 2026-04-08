import { cookies } from 'next/headers'
import { sendGmail } from './google-auth'

export async function sendEmail({ to, subject, body }: { to: string, subject: string, body: string, attachments?: any[] }) {
    try {
        const cookieStore = await cookies();
        const tokensCookie = cookieStore.get('google_tokens');

        if (!tokensCookie) {
            console.warn("[EMAIL] No google_tokens found, falling back to mock");
            return { success: false, error: 'Non sei collegato a Google' };
        }

        const tokens = JSON.parse(tokensCookie.value);
        await sendGmail(tokens, { to, subject, body });

        return { success: true };
    } catch (error) {
        console.error("[EMAIL ERROR]", error);
        return { success: false, error: 'Errore durante l\'invio della mail' };
    }
}
