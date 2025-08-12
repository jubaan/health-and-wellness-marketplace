import { Router } from 'express';
import pool from '../db/client';

const router = Router();

router.get('/search/practitioners', async (req, res) => {
    const { location, specialty } = req.query;

    try {
        const result = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, p.specialty, p.location, p.bio
             FROM practitioners p
             JOIN users u ON p.user_id = u.id
             WHERE
               ($1::text IS NULL OR p.location ILIKE '%' || $1 || '%') AND
               ($2::text IS NULL OR p.specialty ILIKE '%' || $2 || '%')`,
            [location || null, specialty || null]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
