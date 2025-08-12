import { Router, Request, Response } from "express";
import { google } from "googleapis";
import pool from "../db/client";
import { sendEmail } from "../lib/email";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Book a new appointment
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { practitionerId, startTime, endTime } = req.body;
  const { userId: patientId } = req.auth!;

  try {
    // 1. Get practitioner's tokens
    const tokenRes = await pool.query(
      "SELECT * FROM user_tokens WHERE user_id = $1 AND provider = 'google'",
      [practitionerId]
    );
    if (tokenRes.rows.length === 0) {
      return res
        .status(400)
        .json({
          error: "Practitioner has not connected their Google Calendar.",
        });
    }
    const tokens = tokenRes.rows[0];

    // 2. Initialize Google Calendar API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 3. Get patient details for the calendar event
    const patientRes = await pool.query("SELECT * FROM users WHERE id = $1", [
      patientId,
    ]);
    const patient = patientRes.rows[0];

    // 4. Create the Google Calendar event
    const event = {
      summary: `Appointment with ${patient.first_name} ${patient.last_name}`,
      description: `Patient email: ${patient.email}`,
      start: {
        dateTime: startTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime,
        timeZone: "UTC",
      },
      attendees: [{ email: patient.email }],
    };

    const createdEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    // 5. Save the appointment to our database
    const appointmentResult = await pool.query(
      `INSERT INTO appointments (practitioner_user_id, patient_user_id, start_time, end_time, google_calendar_event_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [practitionerId, patientId, startTime, endTime, createdEvent.data.id]
    );

    // 6. Send confirmation emails
    const practitionerRes = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [practitionerId]
    );
    const practitioner = practitionerRes.rows[0];

    const appointmentTime = new Date(startTime).toLocaleString();

    // Email to patient
    await sendEmail({
      to: patient.email,
      from: "noreply@yourplatform.com", // This must be a verified sender
      subject: "Appointment Confirmed!",
      text: `Your appointment with ${practitioner.first_name} ${practitioner.last_name} at ${appointmentTime} is confirmed.`,
      html: `<p>Your appointment with <strong>${practitioner.first_name} ${practitioner.last_name}</strong> at <strong>${appointmentTime}</strong> is confirmed.</p>`,
    });

    // Email to practitioner
    await sendEmail({
      to: practitioner.email,
      from: "noreply@yourplatform.com",
      subject: "New Appointment Booked!",
      text: `You have a new appointment with ${patient.first_name} ${patient.last_name} at ${appointmentTime}.`,
      html: `<p>You have a new appointment with <strong>${patient.first_name} ${patient.last_name}</strong> at <strong>${appointmentTime}</strong>.</p>`,
    });

    res.status(201).json(appointmentResult.rows[0]);
  } catch (err) {
    console.error("Error booking appointment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get appointments for the authenticated user
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.auth!;

  try {
    const result = await pool.query(
      `SELECT a.*, 
                    p.first_name as practitioner_first_name, 
                    p.last_name as practitioner_last_name,
                    pt.first_name as patient_first_name, 
                    pt.last_name as patient_last_name
             FROM appointments a
             LEFT JOIN users p ON a.practitioner_user_id = p.id
             LEFT JOIN users pt ON a.patient_user_id = pt.id
             WHERE a.practitioner_user_id = $1 OR a.patient_user_id = $1
             ORDER BY a.start_time ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel an appointment
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { userId } = req.auth!;

  try {
    // Check if user is authorized to cancel this appointment
    const appointmentRes = await pool.query(
      "SELECT * FROM appointments WHERE id = $1 AND (practitioner_user_id = $2 OR patient_user_id = $2)",
      [id, userId]
    );

    if (appointmentRes.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Appointment not found or unauthorized" });
    }

    const appointment = appointmentRes.rows[0];

    // Delete the appointment from database
    await pool.query("DELETE FROM appointments WHERE id = $1", [id]);

    res.status(204).send();
  } catch (err) {
    console.error("Error canceling appointment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
