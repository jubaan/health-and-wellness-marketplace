import { Router, Request, Response } from "express";
import Stripe from "stripe";

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil", // Updated to match TypeScript types
});

const router = Router();

router.post(
  "/payments/create-payment-intent",
  async (req: AuthenticatedRequest, res: Response) => {
    const { amount } = req.body; // In a real app, get this from practitioner's profile

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount || 5000, // Default to $50.00, amount is in cents
        currency: "usd",
        automatic_payment_methods: { enabled: true },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e: any) {
      res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
  }
);

export default router;
