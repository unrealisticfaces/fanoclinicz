const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `avatar-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// GET: Fetch all users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, role, photo_url, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST: Create a new user account
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'staff']
        );
        res.json({ message: 'User account created successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// POST: Upload Avatar Image (FIXED RELATIVE URL)
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const photoUrl = `/uploads/${req.file.filename}`;
        await db.execute('UPDATE users SET photo_url = ? WHERE id = ?', [photoUrl, req.params.id]);
        res.json({ message: 'Avatar updated successfully', photoUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// PUT: Update User Profile & Role
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            if (role) {
                await db.execute('UPDATE users SET name=?, email=?, role=?, password=? WHERE id=?', [name, email, role, hashedPassword, req.params.id]);
            } else {
                await db.execute('UPDATE users SET name=?, email=?, password=? WHERE id=?', [name, email, hashedPassword, req.params.id]);
            }
        } else {
            if (role) {
                await db.execute('UPDATE users SET name=?, email=?, role=? WHERE id=?', [name, email, role, req.params.id]);
            } else {
                await db.execute('UPDATE users SET name=?, email=? WHERE id=?', [name, email, req.params.id]);
            }
        }
        res.json({ message: 'User updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE: Remove a user
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;