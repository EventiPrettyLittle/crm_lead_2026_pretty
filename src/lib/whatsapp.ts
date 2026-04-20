/**
 * WhatsApp Meta API Integration
 * This service handles sending official WhatsApp Business Templates
 */

interface WhatsAppTemplateParams {
    to: string;
    templateName: string;
    languageCode?: string;
    bodyVariables?: string[];
}

export async function sendWhatsAppTemplate({ 
    to, 
    templateName, 
    languageCode = "it", 
    bodyVariables = [] 
}: WhatsAppTemplateParams) {
    const apikey = process.env.WHATSAPP_API_KEY || 'vCZnSEs9OxYtLimo';
    const token = process.env.WHATSAPP_TOKEN || 'DqvljFxnVAJ3i7XK';

    // Clean phone number
    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) {
        cleanTo = '39' + cleanTo;
    }

    // Costruiamo un messaggio testuale se è un template (per l'API Standard)
    let messageText = "";
    if (templateName === 'notifica_cliente' || templateName === 'contattato') {
        messageText = `Ciao ${bodyVariables[0] || 'Cliente'}, siamo di Pretty Little. Ti abbiamo contattato per il tuo interesse.`;
    } else if (templateName === 'non_risponde') {
        messageText = `Ciao ${bodyVariables[0] || 'Cliente'}, abbiamo provato a chiamarti ma non abbiamo ricevuto risposta. A presto!`;
    } else {
        messageText = `Ciao ${bodyVariables[0] || 'Cliente'}, ti confermiamo l'appuntamento per il ${bodyVariables[2] || ''} alle ore ${bodyVariables[3] || ''}.`;
    }

    const payload = {
        apikey: apikey,
        instance: token, // Nell'API v1 il token è spesso l'ID istanza
        number: cleanTo,
        message: messageText
    };

    const standardUrl = "https://app.sendapp.ai/api/v1/send";

    try {
        const response = await fetch(standardUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Controllo successo per API V1
        if (data.status === "error" || data.error) {
            return { success: false, error: data.message || "Errore SendApp V1" };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: `Connessione Fallita: ${error.message}` };
    }
}

export async function sendWhatsAppMessage({ 
    to, 
    text 
}: { 
    to: string, 
    text: string 
}) {
    const apikey = process.env.WHATSAPP_API_KEY || 'vCZnSEs9OxYtLimo';
    const token = process.env.WHATSAPP_TOKEN || 'DqvljFxnVAJ3i7XK';
    const baseUrl = process.env.WHATSAPP_BASE_URL || "https://app.sendapp.ai/api/whatsapp-meta/send";

    if (!apikey || !token) {
        console.error("WhatsApp credentials missing in .env");
        return { success: false, error: "Credenziali WhatsApp mancanti" };
    }

    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) {
        cleanTo = '39' + cleanTo;
    }

    const payload = {
        apikey,
        instance: token,
        number: cleanTo,
        message: text
    };

    const standardUrl = "https://app.sendapp.ai/api/v1/send";

    try {
        const response = await fetch(standardUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === "error" || data.error) {
            return { success: false, error: data.message || "Errore SendApp V1" };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: `Connessione Fallita: ${error.message}` };
    }
}
