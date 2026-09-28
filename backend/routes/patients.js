const express = require('express');
const db = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [patients] = await db.execute('SELECT * FROM patients ORDER BY created_at DESC');
        res.json(patients);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const [patients] = await db.execute('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (patients.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(patients[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/scan-handwriting', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Extract JSON: first_name, last_name, dob (YYYY-MM-DD), gender, contact_number, email.`;
        const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
        res.json(JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()));
    } catch (error) { res.status(500).json({ error: 'Failed to read document.' }); }
});

router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, dob, gender, contact_number, email } = req.body;
        const [recent] = await db.execute(
            `SELECT id FROM patients WHERE first_name = ? AND last_name = ? AND created_at >= datetime('now', '-15 seconds')`,
            [first_name, last_name]
        );
        if (recent.length > 0) return res.json({ message: 'Duplicate prevented' });

        const [countRes] = await db.execute('SELECT COUNT(*) as count FROM patients');
        const patient_code = `FDC-${1000 + countRes[0].count + 1}`;
        await db.execute(
            `INSERT INTO patients (patient_code, first_name, last_name, dob, gender, contact_number, email) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patient_code, first_name, last_name, dob, gender, contact_number, email || null]
        );
        res.json({ message: 'Patient registered' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const { first_name, last_name, dob, gender, contact_number, email } = req.body;
        await db.execute(
            `UPDATE patients SET first_name=?, last_name=?, dob=?, gender=?, contact_number=?, email=? WHERE id=?`,
            [first_name, last_name, dob, gender, contact_number, email || null, req.params.id]
        );
        res.json({ message: 'Patient updated' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;