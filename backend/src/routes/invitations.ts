import { Router, Request } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/express';
import pool from '../db/client';

interface AuthenticatedRequest extends Request {
  auth?: {
    userId?: string;
  };
}

const router = Router();

// Send an invitation from a company to a user
router.post('/companies/:companyId/invitations', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
  const { companyId } = req.params;
  const { userId: ownerId } = req.auth!;
  const { inviteeUserId } = req.body; // The user ID of the person being invited

  try {
    // Check if the sender is the owner of the company
    const companyCheck = await pool.query('SELECT owner_id FROM companies WHERE id = $1', [companyId]);
    if (companyCheck.rows.length === 0 || companyCheck.rows[0].owner_id !== ownerId) {
      return res.status(403).json({ error: 'You are not authorized to send invitations for this company.' });
    }

    const result = await pool.query(
      'INSERT INTO invitations (company_id, user_id) VALUES ($1, $2) RETURNING *',
      [companyId, inviteeUserId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    // Handle unique constraint violation
    if ((err as any).code === '23505') {
        return res.status(409).json({ error: 'Invitation already sent to this user.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all invitations for the currently logged-in user
router.get('/users/me/invitations', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
    const { userId } = req.auth!;
    try {
        const result = await pool.query('SELECT * FROM invitations WHERE user_id = $1 AND status = \'pending\'', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Accept or decline an invitation
router.put('/invitations/:invitationId', ClerkExpressRequireAuth(), async (req: AuthenticatedRequest, res) => {
  const { invitationId } = req.params;
  const { userId } = req.auth!;
  const { status } = req.body; // 'accepted' or 'declined'

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check if the user is the recipient of the invitation
    const invCheck = await pool.query('SELECT * FROM invitations WHERE id = $1 AND user_id = $2', [invitationId, userId]);
    if (invCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to respond to this invitation.' });
    }

    const invitation = invCheck.rows[0];

    // Begin transaction
    await pool.query('BEGIN');

    // Update the invitation status
    await pool.query('UPDATE invitations SET status = $1 WHERE id = $2', [status, invitationId]);

    // If accepted, add the user to the company_practitioners table
    if (status === 'accepted') {
      // First, ensure the user has a practitioner profile
      const practitionerCheck = await pool.query('SELECT user_id FROM practitioners WHERE user_id = $1', [userId]);
      if (practitionerCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'You must create a practitioner profile before accepting an invitation.' });
      }

      await pool.query(
        'INSERT INTO company_practitioners (company_id, practitioner_user_id) VALUES ($1, $2)',
        [invitation.company_id, userId]
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ success: true, status });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
