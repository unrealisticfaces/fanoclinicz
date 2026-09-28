const express = require('express');
const db = require('../db');
const router = express.Router();

// GET: Dashboard Metrics (Stats, Pie Charts, Area Chart)
router.get('/metrics', async (req, res) => {
    try {
        // 1. Get All-Time Gross and Collected
        const [totals] = await db.execute(`
            SELECT 
                SUM(grand_total) as allTimeGross, 
                SUM(amount_paid) as allTimeCollected 
            FROM invoices
        `);

        // 2. Get Active Patients count
        const [patients] = await db.execute('SELECT COUNT(*) as activePatients FROM patients');

        // 3. Get Daily Revenue for the Area Chart (Last 14 days)
        // CRITICAL FIX: Ensure dates use localtime, and return as a string.
        const [daily] = await db.execute(`
            SELECT 
                DATE(created_at, 'localtime') as date, 
                SUM(grand_total) as gross, 
                SUM(amount_paid) as collected 
            FROM invoices 
            GROUP BY DATE(created_at, 'localtime')
            ORDER BY date DESC
            LIMIT 14
        `);

        // Format the daily revenue into the object structure the frontend expects
        const dailyRevenue = {};
        daily.forEach(row => {
            // CRITICAL FIX: SQLite already returns a "YYYY-MM-DD" string, so we just use it directly!
            const dateStr = row.date; 
            dailyRevenue[dateStr] = {
                gross: parseFloat(row.gross) || 0,
                collected: parseFloat(row.collected) || 0
            };
        });

        res.json({
            allTimeGross: parseFloat(totals[0].allTimeGross) || 0,
            allTimeCollected: parseFloat(totals[0].allTimeCollected) || 0,
            activePatients: patients[0].activePatients || 0,
            dailyRevenue
        });

    } catch (error) {
        console.error('Dashboard Metrics Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Monthly Balances (For the Pending Balances table)
router.get('/monthly-balances', async (req, res) => {
    try {
        // Find invoices that are NOT fully paid, join with patient info
        const query = `
            SELECT 
                i.id, 
                i.created_at, 
                p.first_name, 
                p.last_name, 
                (i.grand_total - i.amount_paid) as grand_total 
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            WHERE i.payment_status != 'paid' AND (i.grand_total - i.amount_paid) > 0
            ORDER BY i.created_at ASC
        `;
        const [balances] = await db.execute(query);
        res.json(balances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;