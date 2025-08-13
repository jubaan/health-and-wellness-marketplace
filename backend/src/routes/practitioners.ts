import { Router, Request, Response } from "express";
import pool from "../db/client";

// Add a custom property 'auth' to the Request type
interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Create a new practitioner profile
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.auth!;
  const { specialty, location, bio, hourly_rate, insurance_accepted } =
    req.body;

  try {
    const result = await pool.query(
      "INSERT INTO practitioners (user_id, specialty, location, bio, hourly_rate, insurance_accepted) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, specialty, location, bio, hourly_rate, insurance_accepted]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a practitioner's profile
router.get("/:userId", async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM practitioners WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Practitioner not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a practitioner's profile
router.put("/:userId", async (req: AuthenticatedRequest, res: Response) => {
  const { userId: paramUserId } = req.params;
  const { userId: authUserId } = req.auth!;

  if (paramUserId !== authUserId) {
    return res
      .status(403)
      .json({ error: "You are not authorized to update this profile." });
  }

  const { specialty, location, bio, hourly_rate, insurance_accepted } =
    req.body;

  try {
    const result = await pool.query(
      "UPDATE practitioners SET specialty = $1, location = $2, bio = $3, hourly_rate = $4, insurance_accepted = $5 WHERE user_id = $6 RETURNING *",
      [specialty, location, bio, hourly_rate, insurance_accepted, authUserId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a practitioner's availability and appointments
router.get(
  "/:userId/availability",
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query; // e.g., '2023-10-26T00:00:00Z'

    try {
      // 1. Get user's tokens from the database
      const tokenRes = await pool.query(
        "SELECT * FROM user_tokens WHERE user_id = $1 AND provider = 'google'",
        [userId]
      );
      if (tokenRes.rows.length === 0) {
        return res
          .status(404)
          .json({
            error: "Google Calendar not connected for this practitioner.",
          });
      }
      const tokens = tokenRes.rows[0];

      // 2. Initialize Google Calendar API client
      const { google } = require("googleapis");
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

      // 3. Query free/busy information
      const timeMin = startDate ? new Date(startDate as string) : new Date();
      const timeMax = endDate
        ? new Date(endDate as string)
        : new Date(timeMin.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

          const freeBusyRes = await calendar.freebusy.query({
            requestBody: {
              timeMin: timeMin.toISOString(),
              timeMax: timeMax.toISOString(),
              items: [{ id: "primary" }],
            },
          });

          const busySlots = freeBusyRes.data.calendars?.primary.busy;

      // 4. Calculate available slots (this is a simplified example)
      // A real implementation would be much more complex, considering working hours, buffer times, etc.
      const availableSlots = [];
      const appointmentDuration = 60 * 60 * 1000; // 60 minutes

      let currentSlot = new Date(timeMin);
      // Assuming working hours are 9am to 5pm in the server's timezone
      currentSlot.setHours(9, 0, 0, 0);
            // Simplified slot calculation
            const appointmentDuration = 60 * 60 * 1000;
            let currentSlot = new Date(timeMin);
            currentSlot.setHours(9, 0, 0, 0);

            while (currentSlot < timeMax) {
                const dayOfWeek = currentSlot.getDay();
                const hour = currentSlot.getHours();
                if (dayOfWeek > 0 && dayOfWeek < 6 && hour >= 9 && hour < 17) {
                    const slotEnd = new Date(currentSlot.getTime() + appointmentDuration);
                    let isBusy = false;
                    if (busySlots) {
                        for (const busy of busySlots) {
                            if (currentSlot < new Date(busy.end!) && slotEnd > new Date(busy.start!)) {
                                isBusy = true;
                                break;
                            }
                        }
                    }
                    if (!isBusy) {
                        availableSlots.push({ start: new Date(currentSlot), end: slotEnd });
                    }
                }
                currentSlot.setTime(currentSlot.getTime() + appointmentDuration);
                if (currentSlot.getHours() >= 17) {
                    currentSlot.setDate(currentSlot.getDate() + 1);
                    currentSlot.setHours(9, 0, 0, 0);
                }
            }
        }

      res.json({ availableSlots, bookedAppointments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete a practitioner's profile
router.delete("/:userId", async (req: AuthenticatedRequest, res: Response) => {
  const { userId: paramUserId } = req.params;
  const { userId: authUserId } = req.auth!;

  if (paramUserId !== authUserId) {
    return res
      .status(403)
      .json({ error: "You are not authorized to delete this profile." });
  }

  try {
    await pool.query("DELETE FROM practitioners WHERE user_id = $1", [
      authUserId,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
