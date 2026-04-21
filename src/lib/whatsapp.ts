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
    const baseUrl = "https://app.sendapp.ai/api/whatsapp-meta/send";

    // 1. Pulizia numero
    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) {
        cleanTo = '39' + cleanTo;
    }

    // 2. Costruzione payload (come da tuo CURL)
    const bodyParameters = bodyVariables.map(text => ({
        type: "text",
        text: text
    }));

    const payload = {
        apikey: apikey,
        token: token,
        number: cleanTo,
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            components: bodyParameters.length > 0 ? [
                {
                    type: "body",
                    parameters: bodyParameters
                }
            ] : []
        }
    };

    try {
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.status === "error" || data.error) {
            const detail = data.message || data.error?.message || JSON.stringify(data);
            return { 
                success: false, 
                error: `Meta API: ${detail}` 
            };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: `Errore Rete: ${error.message}` };
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

    const standardUrl = "https://app.sendapp.live/api/v1/send";

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
