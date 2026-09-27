const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// CRITICAL FIX: Force the Windows Service to look in the exact backend folder for the .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// --- LIVE LOGGING TO FILE ---
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    const msg = `[${new Date().toLocaleTimeString()}] INFO: ` + args.join(' ');
    logStream.write(msg + '\n');
    originalLog.apply(console, args);
};
console.error = function (...args) {
    const msg = `[${new Date().toLocaleTimeString()}] ERROR: ` + args.join(' ');
    logStream.write(msg + '\n');
    originalError.apply(console, args);
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// --- API ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/invoices', require('./routes/billing'));
app.use('/api/clinical', require('./routes/clinical'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/system', require('./routes/system')); 
app.use('/api/queue', require('./routes/queue'));

// --- SERVE COMPILED REACT FRONTEND ---
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log(`User connected to queue socket: ${socket.id}`);
    socket.on('new_arrival', () => io.emit('queue_updated'));
    socket.on('call_patient', (data) => {
        console.log(`Calling Patient: ${data.name} to ${data.room}`);
        io.emit('patient_called', data);
        io.emit('queue_updated');        
    });
    socket.on('disconnect', () => console.log(`User disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Fano Dental API securely bound to ${HOST}:${PORT}`);
    console.log(`Socket.io server active for Queue Manager`);
});