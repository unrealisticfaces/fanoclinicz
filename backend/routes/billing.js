const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [invoices] = await db.execute(`SELECT i.*, p.first_name, p.last_name, p.contact_number FROM invoices i JOIN patients p ON i.patient_id = p.id ORDER BY i.created_at DESC`);
        res.json(invoices);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/patient/:id', async (req, res) => {
    try {
        const [invoices] = await db.execute('SELECT * FROM invoices WHERE patient_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json(invoices);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { patient_id, grand_total, payment_status, payment_method, amount_paid } = req.body;
        const [recent] = await db.execute(
            `SELECT id FROM invoices WHERE patient_id = ? AND grand_total = ? AND created_at >= datetime('now', '-15 seconds')`,
            [patient_id, grand_total]
        );
        if (recent.length > 0) return res.json({ message: 'Duplicate prevented' });

        const [countRes] = await db.execute('SELECT COUNT(*) as count FROM invoices');
        const invoice_number = `INV-${1000 + countRes[0].count + 1}`;
        let final_amount_paid = payment_status === 'paid' ? grand_total : (payment_status === 'partial' ? (amount_paid || 0) : 0);

        await db.execute(
            `INSERT INTO invoices (invoice_number, patient_id, grand_total, amount_paid, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?)`,
            [invoice_number, patient_id, grand_total, final_amount_paid, payment_status, payment_method]
        );
        res.json({ message: 'Invoice created' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;