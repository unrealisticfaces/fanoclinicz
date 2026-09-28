const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // Auto-Seeder: Create admin if it doesn't exist
        if (users.length === 0 && email === 'admin@fanodental.com') {
            const hashedPass = await bcrypt.hash('admin123', 10);
            await db.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
                ['Admin', 'admin@fanodental.com', hashedPass, 'admin']
            );
            
            const [newUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            const user = newUsers[0];
            
            return res.json({ 
                token: 'fano-auth-token', 
                user: { id: user.id, name: user.name, email: user.email, photoURL: user.photo_url, role: user.role } 
            });
        }

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = users[0];
        const dbPassword = user.password || ''; 
        const isMatch = await bcrypt.compare(password, dbPassword);

        // Failsafe Override
        if (!isMatch) {
            if (email === 'admin@fanodental.com' && password === 'admin123') {
                const hashedPass = await bcrypt.hash('admin123', 10);
                await db.execute('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashedPass, 'admin', email]);
                
                return res.json({ 
                    token: 'fano-auth-token', 
                    user: { id: user.id, name: user.name, email: user.email, photoURL: user.photo_url, role: user.role } 
                });
            }
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Standard successful login (Now includes the role)
        res.json({ 
            token: 'fano-auth-token', 
            user: { id: user.id, name: user.name, email: user.email, photoURL: user.photo_url, role: user.role } 
        });

    } catch (error) {
        console.error('Login Error Detailed:', error);
        res.status(500).json({ error: 'Server error during login', details: error.message });
    }
});

module.exports = router;