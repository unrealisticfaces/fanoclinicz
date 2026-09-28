const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // CRITICAL FIX: Convert the UTC database time to local time before checking if it is "today"
        const [rows] = await db.execute(`SELECT * FROM daily_queue WHERE date(created_at, 'localtime') = date('now', 'localtime') ORDER BY id ASC`);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch queue' }); }
});

router.post('/join', async (req, res) => {
    try {
        const { name, purpose } = req.body;
        const [recent] = await db.execute(
            `SELECT id FROM daily_queue WHERE patient_name = ? AND purpose = ? AND created_at >= datetime('now', '-15 seconds')`,
            [name, purpose]
        );
        if (recent.length > 0) return res.json({ message: 'Duplicate prevented', id: recent[0].id });

        const [result] = await db.execute('INSERT INTO daily_queue (patient_name, purpose) VALUES (?, ?)', [name, purpose]);
        res.json({ message: 'Added to queue', id: result.insertId });
    } catch (error) { res.status(500).json({ error: 'Failed to join queue' }); }
});

router.put('/:id/call', async (req, res) => {
    try {
        const { dentist, room } = req.body;
        const [current] = await db.execute('SELECT status FROM daily_queue WHERE id = ?', [req.params.id]);
        if (current.length > 0 && current[0].status === 'called') return res.json({ message: 'Patient already called' });

        await db.execute('UPDATE daily_queue SET status = "called", dentist = ?, room = ? WHERE id = ?', [dentist, room, req.params.id]);
        res.json({ message: 'Patient called' });
    } catch (error) { res.status(500).json({ error: 'Failed to call patient' }); }
});

router.put('/:id/complete', async (req, res) => {
    try {
        await db.execute('UPDATE daily_queue SET status = "completed" WHERE id = ?', [req.params.id]);
        res.json({ message: 'Visit completed' });
    } catch (error) { res.status(500).json({ error: 'Failed to complete visit' }); }
});

module.exports = router;