import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface Email {
    to: string;
    from: string; // This should be a verified sender in SendGrid
    subject: string;
    text: string;
    html: string;
}

export async function sendEmail(msg: Email) {
    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${msg.to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // In a real app, you might want more robust error handling
    }
}
