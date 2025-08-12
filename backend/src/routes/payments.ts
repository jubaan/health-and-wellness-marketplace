import { Router } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const router = Router();

router.post('/payments/create-payment-intent', async (req, res) => {
    const { amount } = req.body; // In a real app, get this from practitioner's profile

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount || 5000, // Default to $50.00, amount is in cents
            currency: 'usd',
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
});

export default router;
