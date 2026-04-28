export async function sendSlackNotification(message: string) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn('SLACK_WEBHOOK_URL not set, skipping notification');
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message,
            }),
        });

        if (!response.ok) {
            throw new Error(`Slack notification failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending Slack notification:', error);
    }
}
