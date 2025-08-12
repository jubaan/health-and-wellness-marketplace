import { Router, Request, Response } from "express";
import { google } from "googleapis";
import pool from "../db/client";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

// Redirect to Google's consent screen
router.get(
  "/oauth/google",
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.auth!;
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: userId, // Pass the userId in the state parameter
    });
    res.redirect(url);
  }
);

// Handle the callback from Google
router.get("/oauth/google/callback", async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send("Missing code or state");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token) {
      return res.status(400).send("Failed to retrieve access token");
    }

    // Store the tokens in the database
    await pool.query(
      `INSERT INTO user_tokens (user_id, provider, access_token, refresh_token, expires_at)
       VALUES ($1, 'google', $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, user_tokens.refresh_token),
         expires_at = EXCLUDED.expires_at`,
      [
        userId,
        access_token,
        refresh_token,
        expiry_date ? new Date(expiry_date) : null,
      ]
    );

    // Redirect user to their profile page or a success page
    res.redirect("/profile"); // This should ideally be a frontend URL
  } catch (err) {
    console.error("Error getting tokens from Google:", err);
    res.status(500).send("Internal server error");
  }
});

export default router;
