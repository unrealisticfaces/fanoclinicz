const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'fano_dental.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("[DB ERROR] Could not connect to SQLite:", err.message);
    else console.log("[DB] Connected to SQLite database.");
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    // 1. Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        email TEXT NOT NULL UNIQUE, 
        password TEXT NOT NULL, 
        role TEXT DEFAULT 'staff', 
        photo_url TEXT DEFAULT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Patients
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        patient_code TEXT NOT NULL UNIQUE, 
        first_name TEXT NOT NULL, 
        last_name TEXT NOT NULL, 
        dob TEXT NOT NULL, 
        gender TEXT NOT NULL, 
        contact_number TEXT NOT NULL, 
        email TEXT DEFAULT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Invoices
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        invoice_number TEXT NOT NULL UNIQUE, 
        patient_id INTEGER NOT NULL, 
        grand_total REAL NOT NULL, 
        amount_paid REAL DEFAULT 0.00, 
        payment_status TEXT DEFAULT 'unpaid', 
        payment_method TEXT DEFAULT 'cash', 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )`);

    // 4. Dental Charts
    db.run(`CREATE TABLE IF NOT EXISTS dental_charts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        patient_id INTEGER NOT NULL, 
        dentist_id INTEGER NOT NULL, 
        tooth_number INTEGER NOT NULL, 
        condition_code TEXT NOT NULL, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE, 
        FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 5. Daily Queue
    db.run(`CREATE TABLE IF NOT EXISTS daily_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        patient_name TEXT, 
        purpose TEXT, 
        dentist TEXT DEFAULT NULL, 
        room TEXT DEFAULT NULL, 
        status TEXT DEFAULT 'waiting', 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 6. System Settings
    db.run(`CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        clinicName TEXT, address TEXT, phone TEXT, email TEXT, taxId TEXT,
        currency TEXT, timezone TEXT, audioAlerts INTEGER, browserPush INTEGER, 
        autoClearQueue INTEGER, autoBackup INTEGER
    )`, () => {
        db.get("SELECT COUNT(*) as count FROM system_settings", (err, row) => {
            if (row && row.count === 0) {
                db.run(`INSERT INTO system_settings (id, clinicName, address, phone, email, taxId, currency, timezone, audioAlerts, browserPush, autoClearQueue, autoBackup) 
                VALUES (1, 'Fano Dental Clinic', '123 Main Street, Cebu City, Philippines', '0917-123-4567', 'hello@fanodental.com', '000-123-456-000', 'PHP', 'Asia/Manila', 1, 0, 1, 0)`);
            }
        });
    });

    // 7. Initial Admin Setup
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT INTO users (name, email, password, role) 
                    VALUES ('Admin', 'admin@fanodental.com', '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'admin')`);
            console.log("[DB] Default Admin created successfully.");
        }
    });
});

const execute = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve([rows]); });
        } else {
            db.run(sql, params, function(err) { if (err) reject(err); else resolve([{ insertId: this.lastID, affectedRows: this.changes }]); });
        }
    });
};

module.exports = { execute, query: execute };