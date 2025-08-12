import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { handler as clerkWebhookHandler } from "./webhooks/clerk";
import practitionerRoutes from "./routes/practitioners";
import companyRoutes from "./routes/companies";
import invitationRoutes from "./routes/invitations";
import userRoutes from "./routes/users";
import searchRoutes from "./routes/search";
import oauthRoutes from "./routes/oauth";
import appointmentRoutes from "./routes/appointments";
import paymentRoutes from "./routes/payments";
import "./jobs/reminders"; // This will start the cron job

const app = express();
const port = process.env.PORT || 3001;

// Initialize Clerk middleware
app.use(clerkMiddleware());

// Other routes should use express.json()
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Clerk webhook handler (no auth needed for webhooks)
app.post(
  "/api/webhooks/clerk",
  bodyParser.raw({ type: "application/json" }),
  clerkWebhookHandler
);

// Routes (add requireAuth() to protect specific routes)
app.use("/api/practitioners", requireAuth(), practitionerRoutes);
app.use("/api/companies", requireAuth(), companyRoutes);
app.use("/api", requireAuth(), invitationRoutes);
app.use("/api", requireAuth(), userRoutes);
app.use("/api", requireAuth(), searchRoutes);
app.use("/api", requireAuth(), oauthRoutes);
app.use("/api", requireAuth(), appointmentRoutes);
app.use("/api", requireAuth(), paymentRoutes);

// Clerk error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(401).send("Unauthenticated!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
