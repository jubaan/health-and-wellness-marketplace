import { Router, Request } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/express';
import pool from '../db/client';

// Add a custom property 'auth' to the Request type
interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Create a new company
router.post('/', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
  const { userId } = req.auth!;
  const { name, website, address, description } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO companies (name, owner_id, website, address, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, userId, website, address, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a company's details
router.get('/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
        const result = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all practitioners for a company
router.get('/:companyId/practitioners', async (req, res) => {
    const { companyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.email
             FROM users u
             JOIN company_practitioners cp ON u.id = cp.practitioner_user_id
             WHERE cp.company_id = $1`,
            [companyId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a company
router.put('/:companyId', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.params;
    const { userId: authUserId } = req.auth!;
    const { name, website, address, description } = req.body;

    try {
        // First, check if the user is the owner of the company
        const ownerCheck = await pool.query('SELECT owner_id FROM companies WHERE id = $1', [companyId]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        if (ownerCheck.rows[0].owner_id !== authUserId) {
            return res.status(403).json({ error: 'You are not authorized to update this company.' });
        }

        const result = await pool.query(
            'UPDATE companies SET name = $1, website = $2, address = $3, description = $4 WHERE id = $5 RETURNING *',
            [name, website, address, description, companyId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a company
router.delete('/:companyId', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.params;
    const { userId: authUserId } = req.auth!;

    try {
        // First, check if the user is the owner of the company
        const ownerCheck = await pool.query('SELECT owner_id FROM companies WHERE id = $1', [companyId]);
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        if (ownerCheck.rows[0].owner_id !== authUserId) {
            return res.status(403).json({ error: 'You are not authorized to delete this company.' });
        }

        await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
