import { Webhook } from 'svix';
import { Request, Response } from 'express';
import pool from '../db/client';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

export async function handler(req: Request, res: Response) {
  // We need the raw body to verify the webhook signature
  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(webhookSecret);
  let msg: any;
  try {
    msg = wh.verify(JSON.stringify(payload), headers as any);
  } catch (err) {
    console.error('Error verifying webhook:', err);
    res.status(400).json({});
    return;
  }

  const { id, email_addresses, phone_numbers, first_name, last_name } = msg.data;
  const eventType = msg.type;

  if (eventType === 'user.created') {
    const phoneNumber = phone_numbers && phone_numbers.length > 0 ? phone_numbers[0].phone_number : null;
    try {
      await pool.query(
        'INSERT INTO users (id, email, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4, $5)',
        [id, email_addresses[0].email_address, first_name, last_name, phoneNumber]
      );
      console.log(`User ${id} was created in the database.`);
    } catch (err) {
      console.error('Error inserting user into database:', err);
      // It's important to still return a 200 status to Clerk
      // otherwise they will keep retrying the webhook.
      // You might want to add more sophisticated error handling here.
    }
  }

  res.json({ success: true });
}
