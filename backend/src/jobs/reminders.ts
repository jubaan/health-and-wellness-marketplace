import cron from 'node-cron';
import pool from '../db/client';
import { sendWhatsAppMessage } from '../lib/whatsapp';

// This cron job runs every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running appointment reminder job...');

    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    try {
        const result = await pool.query(
            `SELECT a.id, a.start_time, p.first_name as patient_first_name, p.phone_number as patient_phone, pr.first_name as practitioner_first_name
             FROM appointments a
             JOIN users p ON a.patient_user_id = p.id
             JOIN users pr ON a.practitioner_user_id = pr.id
             WHERE a.start_time >= $1 AND a.start_time < $2 AND a.status = 'confirmed'`,
            [reminderWindowStart, reminderWindowEnd]
        );

        for (const appointment of result.rows) {
            if (appointment.patient_phone) {
                const message = `Hi ${appointment.patient_first_name}, this is a reminder for your appointment with ${appointment.practitioner_first_name} tomorrow at ${new Date(appointment.start_time).toLocaleTimeString()}.`;

                // Format phone number for Twilio (e.g., 'whatsapp:+15551234567')
                const to = `whatsapp:${appointment.patient_phone}`;

                await sendWhatsAppMessage({ to, body: message });
            }
        }
    } catch (err) {
        console.error('Error running reminder job:', err);
    }
});
