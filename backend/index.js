const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const logPath = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

// CRITICAL FIX: Catch fatal crashes and force them into the log
process.on('uncaughtException', (err) => {
    fs.appendFileSync(logPath, `\n[FATAL CRASH] ${err.stack}\n`);
    process.exit(1);
});

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/invoices', require('./routes/billing'));
app.use('/api/clinical', require('./routes/clinical'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/system', require('./routes/system')); 
app.use('/api/queue', require('./routes/queue'));

const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// CRITICAL FIX: Express 5 requires a Regex /(.*)/ instead of the old '*' syntax
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fano Dental API successfully bound to Port ${PORT}`);
    console.log(`System is fully accessible via Localhost and LAN Network.`);
});