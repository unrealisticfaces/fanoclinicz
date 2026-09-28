const express = require('express');
const db = require('../db');
const router = express.Router();

// GET: Fetch all tooth charting data for a specific patient
router.get('/:patientId', async (req, res) => {
    try {
        const [charts] = await db.execute(
            'SELECT tooth_number, condition_code FROM dental_charts WHERE patient_id = ?', 
            [req.params.patientId]
        );
        
        // Format into an object like { "18": { code: "CARIES" }, "21": { code: "MISSING" } }
        const formattedCharts = {};
        charts.forEach(row => {
            formattedCharts[row.tooth_number] = { code: row.condition_code };
        });

        res.json(formattedCharts);
    } catch (error) {
        console.error('Fetch Charts Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Add or Update a tooth's condition
router.post('/', async (req, res) => {
    try {
        const { patient_id, dentist_id, tooth_number, condition_code } = req.body;

        // Check if this specific tooth already has a record for this patient
        const [existing] = await db.execute(
            'SELECT id FROM dental_charts WHERE patient_id = ? AND tooth_number = ?',
            [patient_id, tooth_number]
        );

        if (existing.length > 0) {
            // Update the existing tooth condition
            await db.execute(
                'UPDATE dental_charts SET condition_code = ?, dentist_id = ? WHERE id = ?',
                [condition_code, dentist_id, existing[0].id]
            );
        } else {
            // Insert a new tooth condition
            await db.execute(
                'INSERT INTO dental_charts (patient_id, dentist_id, tooth_number, condition_code) VALUES (?, ?, ?, ?)',
                [patient_id, dentist_id, tooth_number, condition_code]
            );
        }

        res.json({ message: 'Tooth condition saved successfully' });
    } catch (error) {
        console.error('Save Chart Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;