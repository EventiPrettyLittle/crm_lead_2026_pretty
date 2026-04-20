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
    const baseUrl = process.env.WHATSAPP_BASE_URL || "https://app.sendapp.ai/api/whatsapp-meta/send";

    if (!apikey || !token) {
        console.error("WhatsApp credentials missing in .env");
        return { success: false, error: "Credenziali WhatsApp mancanti" };
    }

    // Clean phone number: remove +, spaces, and any non-digit. 
    // SendApp wants '393331234567', NOT '+393331234567'
    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) {
        cleanTo = '39' + cleanTo;
    }

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
            language: {
                code: languageCode
            },
            components: bodyParameters.length > 0 ? [
                {
                    type: "body",
                    parameters: bodyParameters
                }
            ] : []
        }
    };

    try {
        console.log("Sending WhatsApp to:", cleanTo, "Template:", templateName);
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.status === "error" || data.error) {
            console.error("WhatsApp API Detail Error:", data);
            const detail = data.message || data.error?.message || JSON.stringify(data);
            return { 
                success: false, 
                error: `API Resp: ${detail}` 
            };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("WhatsApp Exception:", error);
        return { success: false, error: `Exception: ${error.message || 'Network Error'}` };
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
        token,
        number: cleanTo,
        type: "text",
        text: text
    };

    try {
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.status === "error") {
            console.error("WhatsApp API Error:", data);
            return { 
                success: false, 
                error: data?.message || data?.error?.message || "Errore durante l'invio del messaggio" 
            };
        }

        return { success: true, data };
    } catch (error) {
        console.error("WhatsApp Fetch Exception:", error);
        return { success: false, error: "Errore di connessione con SendApp API" };
    }
}
