import { cookies } from 'next/headers'
import { sendGmail } from './google-auth'

export async function sendEmail({ to, subject, body, attachment }: { to: string, subject: string, body: string, attachment?: { filename: string, content: Buffer } }) {
    try {
        const cookieStore = await cookies();
        const tokensCookie = cookieStore.get('google_tokens');

        if (!tokensCookie) {
            console.warn("[EMAIL] No google_tokens found");
            return { success: false, error: 'Account Google non collegato. Vai nel Calendario e clicca Connetti Google.' };
        }

        const tokens = JSON.parse(tokensCookie.value);
        await sendGmail(tokens, { to, subject, body, attachment });

        return { success: true };
    } catch (error: any) {
        console.error("[EMAIL ERROR]", error);
        const errorMsg = error.message?.includes('insufficient permissions') || error.message?.includes('scope')
            ? 'Permessi Gmail insufficienti. Ricollega Google e accetta il permesso di invio email.'
            : 'Errore durante l\'invio della mail tramite Gmail.';
        return { success: false, error: errorMsg };
    }
}
