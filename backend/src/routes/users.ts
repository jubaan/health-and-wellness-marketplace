import { Router } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/express';
import clerkClient from '../lib/clerk';

const router = Router();

// Find a user by email
router.get('/users/by-email/:email', ClerkExpressRequireAuth(), async (req, res) => {
    const { email } = req.params;
    try {
        const users = await clerkClient.users.getUserList({ emailAddress: [email] });
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
