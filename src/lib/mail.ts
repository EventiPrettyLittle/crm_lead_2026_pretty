import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'eventiprettylittle@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'yjih mmky cabp omlc'
    }
});

export async function sendResetPasswordEmail(to: string, token: string) {
    try {
        console.log(`[MAIL] Tentativo invio email a: ${to}`);
        // Usiamo la variabile d'ambiente per il dominio, con fallback sicuro alla produzione
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-lead-2026-pretty.vercel.app';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        
        const mailOptions = {
            from: `"Platinum CRM" <${process.env.GMAIL_USER || 'eventiprettylittle@gmail.com'}>`,
            to: to,
            subject: 'Recupero Password - Platinum CRM',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">PLATINUM CRM</h1>
                        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Logistics Management</p>
                    </div>
                    
                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Recupero Password</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
                        Abbiamo ricevuto una richiesta di reset della password per il tuo account. Clicca sul pulsante qui sotto per procedere.
                    </p>
                    
                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Reimposta Password
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; line-height: 20px; margin-bottom: 32px;">
                        Questo link scadrà tra <strong>1 ora</strong>. Se non hai richiesto tu questa modifica, puoi ignorare questa email in tutta sicurezza.
                    </p>
                    
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; 2026 Platinum CRM. Tutti i diritti riservati.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Email inviata con successo! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("[MAIL] Errore critico durante l'invio email:", error);
        throw error;
    }
}
