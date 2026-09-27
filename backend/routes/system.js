const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const logFilePath = path.join(__dirname, '../system_logs.json');
let isBackingUp = false; 

// --- 1. AUTO-INITIALIZE SYSTEM SETTINGS TABLE ---
const initSettingsDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT PRIMARY KEY, clinicName VARCHAR(255), address VARCHAR(255),
                phone VARCHAR(100), email VARCHAR(100), taxId VARCHAR(100),
                currency VARCHAR(20), timezone VARCHAR(100), audioAlerts BOOLEAN,
                browserPush BOOLEAN, autoClearQueue BOOLEAN, autoBackup BOOLEAN
            )
        `);
        const [rows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO system_settings 
                (id, clinicName, address, phone, email, taxId, currency, timezone, audioAlerts, browserPush, autoClearQueue, autoBackup) 
                VALUES (1, 'Fano Dental Clinic', '123 Main Street, Cebu City, Philippines', '0917-123-4567', 'hello@fanodental.com', '000-123-456-000', 'PHP', 'Asia/Manila', 1, 0, 1, 0)
            `);
        }
    } catch (err) {
        console.error("Failed to initialize settings table:", err.message);
    }
};
initSettingsDB();

// --- 2. SETTINGS API ROUTES ---
router.get('/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
        const settings = rows[0];
        settings.audioAlerts = !!settings.audioAlerts;
        settings.browserPush = !!settings.browserPush;
        settings.autoClearQueue = !!settings.autoClearQueue;
        settings.autoBackup = !!settings.autoBackup;
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { clinicName, address, phone, email, taxId, currency, timezone, audioAlerts, browserPush, autoClearQueue, autoBackup } = req.body;
        await db.query(`
            UPDATE system_settings SET 
            clinicName=?, address=?, phone=?, email=?, taxId=?, currency=?, timezone=?, 
            audioAlerts=?, browserPush=?, autoClearQueue=?, autoBackup=? 
            WHERE id = 1
        `, [clinicName, address, phone, email, taxId, currency, timezone, audioAlerts ? 1 : 0, browserPush ? 1 : 0, autoClearQueue ? 1 : 0, autoBackup ? 1 : 0]);
        res.json({ message: 'Settings saved to database successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// --- 3. SYSTEM LOGS ROUTE ---
const addSystemLog = (action, status, details) => {
    let logs = [];
    if (fs.existsSync(logFilePath)) {
        try { logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8')); } catch(e) {}
    }
    logs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), action, status, details });
    fs.writeFileSync(logFilePath, JSON.stringify(logs.slice(0, 100), null, 2)); 
};

router.get('/logs', (req, res) => {
    let logs = [];
    if (fs.existsSync(logFilePath)) {
        try { logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8')); } catch(e) {}
    }
    let backups = [];
    const backupDir = path.join(__dirname, '../backups');
    if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db') || f.endsWith('.sql'));
        backups = files.map(f => {
            const stats = fs.statSync(path.join(backupDir, f));
            return { name: f, size: (stats.size / 1024).toFixed(1) + ' KB', date: stats.mtime };
        }).sort((a, b) => b.date - a.date);
    }
    res.json({ logs, backups });
});

// --- 4. BACKUP EXECUTION (SQLITE FIX) ---
router.post('/daily-backup', async (req, res) => {
    if (isBackingUp) return res.json({ message: 'A backup is currently in progress.' });
    
    const { manual } = req.body || {}; 

    if (!manual) {
        const [rows] = await db.query('SELECT autoBackup FROM system_settings WHERE id = 1');
        if (!rows[0].autoBackup) return res.json({ message: 'Auto-backup is disabled in global settings. Skipped.' });
    }

    const date = new Date();
    const todayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const fileName = manual ? `manual_backup_${Date.now()}.db` : `fano_backup_${todayStr}.db`;
    const backupPath = path.join(backupDir, fileName);

    if (!manual && fs.existsSync(backupPath)) {
        return res.json({ message: 'Backup already exists for today. Skipped.' });
    }

    isBackingUp = true;
    try {
        const sourceDb = path.join(__dirname, '../fano_dental.db');
        fs.copyFileSync(sourceDb, backupPath);
        addSystemLog('Database Backup', 'SUCCESS', `Saved: ${fileName}`);
        res.json({ message: 'Backup created successfully.' });
    } catch (error) {
        addSystemLog('Database Backup', 'ERROR', `Failed: ${error.message}`);
        res.status(500).json({ error: 'Backup failed' });
    } finally {
        isBackingUp = false;
    }
});

// --- 5. SECURE WIPE (SQLITE FIX) ---
router.post('/wipe', async (req, res) => {
    const { adminId, password } = req.body;
    try {
        const [users] = await db.execute('SELECT password, role FROM users WHERE id = ?', [adminId]);
        if (users.length === 0 || users[0].role !== 'admin') return res.status(403).json({ error: 'Unauthorized.' });

        const isMatch = await bcrypt.compare(password, users[0].password);
        if (!isMatch) {
            addSystemLog('Factory Reset', 'WARNING', 'Failed wipe attempt (Invalid Password)');
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        await db.execute('PRAGMA foreign_keys = OFF');
        await db.execute('DELETE FROM patients');
        await db.execute('DELETE FROM invoices');
        await db.execute('DELETE FROM dental_charts');
        await db.execute('DELETE FROM daily_queue');
        
        // Reset Auto-Increments
        await db.execute('DELETE FROM sqlite_sequence WHERE name="patients"');
        await db.execute('DELETE FROM sqlite_sequence WHERE name="invoices"');
        await db.execute('DELETE FROM sqlite_sequence WHERE name="dental_charts"');
        await db.execute('DELETE FROM sqlite_sequence WHERE name="daily_queue"');
        await db.execute('PRAGMA foreign_keys = ON');

        addSystemLog('Factory Reset', 'SUCCESS', 'System data wiped by Administrator');
        res.json({ message: 'System database successfully wiped.' });
    } catch (error) {
        addSystemLog('Factory Reset', 'ERROR', `Wipe failed: ${error.message}`);
        res.status(500).json({ error: 'Failed to wipe system data.' });
    }
});

module.exports = router;