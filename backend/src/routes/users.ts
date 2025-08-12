import { Router, Request, Response } from "express";
import clerkClient from "../lib/clerk";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Find a user by email
router.get("/users/:email", async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const users = await clerkClient.users.getUserList({
      emailAddress: [email],
    });
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user profile from Clerk
router.get("/profile", async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.auth!;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
