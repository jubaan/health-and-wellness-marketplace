import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

const client = twilio(accountSid, authToken);

interface WhatsAppMessage {
    to: string; // The recipient's WhatsApp number, e.g., 'whatsapp:+15551234567'
    body: string;
}

export async function sendWhatsAppMessage(msg: WhatsAppMessage) {
    try {
        await client.messages.create({
            from: from!,
            to: msg.to,
            body: msg.body,
        });
        console.log(`WhatsApp message sent to ${msg.to}`);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
    }
}
