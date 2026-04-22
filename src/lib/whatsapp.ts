/**
 * WhatsApp Meta API Integration
 * EXACT MATCH with SendApp Meta CURL provided by user
 */

interface WhatsAppTemplateParams {
    to: string;
    templateName: string;
    bodyVariables?: string[];
}

export async function sendWhatsAppTemplate({ 
    to, 
    templateName, 
    bodyVariables = [] 
}: WhatsAppTemplateParams) {
    const apikey = process.env.WHATSAPP_API_KEY || 'vCZnSEs9OxYtLimo';
    const token = process.env.WHATSAPP_TOKEN || 'DqvljFxnVAJ3i7XK';

    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) {
        cleanTo = '39' + cleanTo;
    }

    // Trasformazione variabili nel formato "components" richiesto da Meta
    const parameters = bodyVariables.map(val => ({
        type: "text",
        text: val
    }));

    // Costruzione payload ESATTA come da CURL fornito
    const payload = {
        apikey: apikey,
        token: token, // SendApp Meta lo chiama "token" (non instance)
        number: cleanTo,
        type: "template",
        template: {
            name: templateName,
            language: { "code": "it" },
            components: [
                {
                    type: "body",
                    parameters: parameters
                }
            ]
        }
    };

    const url = "https://app.sendapp.ai/api/whatsapp-meta/send";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === "error" || data.error) {
            return { success: false, error: data.message || "Template Error" };
        }
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: "SendApp Meta Connection Failed" };
    }
}

export async function sendWhatsAppMessage({ to, text }: { to: string, text: string }) {
    const apikey = process.env.WHATSAPP_API_KEY || 'vCZnSEs9OxYtLimo';
    const token = process.env.WHATSAPP_TOKEN || 'DqvljFxnVAJ3i7XK';

    let cleanTo = to.replace(/\D/g, "");
    if (cleanTo.length === 10 && cleanTo.startsWith('3')) cleanTo = '39' + cleanTo;

    const payload = {
        apikey,
        instance: token,
        number: cleanTo,
        message: text
    };

    try {
        const response = await fetch("https://app.sendapp.ai/api/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return { success: data.status === "success" || !data.error, data };
    } catch (error) {
        return { success: false, error: "Errore Hub SendApp" };
    }
}
