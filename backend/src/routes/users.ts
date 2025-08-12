import { Router, Request } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/express';
import clerkClient from '../lib/clerk';
import pool from '../db/client';

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Get the roles of the logged-in user
router.get('/users/me/roles', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { userId } = req.auth!;
    try {
        const practitionerCheck = await pool.query('SELECT 1 FROM practitioners WHERE user_id = $1', [userId]);
        const companyOwnerCheck = await pool.query('SELECT 1 FROM companies WHERE owner_id = $1', [userId]);

        res.json({
            isPractitioner: practitionerCheck.rows.length > 0,
            isCompanyOwner: companyOwnerCheck.rows.length > 0,
        });
    } catch (err) {
        console.error('Error fetching user roles:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all companies owned by the logged-in user
router.get('/users/me/companies', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { userId } = req.auth!;
    try {
        const result = await pool.query('SELECT * FROM companies WHERE owner_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching companies:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all appointments for the logged-in user (as a patient)
router.get('/users/me/appointments', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { userId } = req.auth!;
    try {
        const result = await pool.query(
            `SELECT a.*, u.first_name as practitioner_first_name, u.last_name as practitioner_last_name
             FROM appointments a
             JOIN users u ON a.practitioner_user_id = u.id
             WHERE a.patient_user_id = $1
             ORDER BY a.start_time DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


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
