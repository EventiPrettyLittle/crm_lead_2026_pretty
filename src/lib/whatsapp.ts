/**
 * WhatsApp Meta API Integration
 * Optimized for SendApp Cloud / Meta Templates
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

    // Costruzione payload specifico per SendApp Cloud/Meta Templates
    const payload = {
        apikey,
        instance: token,
        number: cleanTo,
        template: templateName,
        variables: bodyVariables
    };

    // Usiamo l'endpoint specifico per Meta se possibile, o quello generale v1 con mapping template
    const url = "https://app.sendapp.ai/api/v1/send";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === "error" || data.error) {
            return { success: false, error: data.message || "Template non trovato su SendApp" };
        }
        return { success: true, data };
    } catch (error: any) {
        // Se il JSON fallisce, leggiamo il testo per capire l'errore HTML
        return { success: false, error: `SendApp Offline o Endpoint Errato (HTML Response)` };
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
