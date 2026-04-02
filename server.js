const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection } = require('./src/config/db');
const apiRoutes = require('./src/routes');
const esp32Routes = require('./src/routes/esp32');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// API routes
app.use('/api', apiRoutes);

// ESP32 dedicated endpoint (no auth, optimized for IoT)
app.use('/api/esp32', esp32Routes);

// 404 and error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  // Join a tank room for targeted updates
  socket.on('join-tank', (tankId) => {
    socket.join(`tank-${tankId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined tank-${tankId}`);
  });
  
  socket.on('leave-tank', (tankId) => {
    socket.leave(`tank-${tankId}`);
    console.log(`[Socket.IO] Client ${socket.id} left tank-${tankId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start server after verifying DB connection
testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is active on port ${PORT}`);
    console.log(`WebSocket server ready for real-time updates`);
    console.log(`ESP32 endpoint: http://YOUR_SERVER_IP:${PORT}/api/esp32/data`);
  });
});

// Export io for use in other modules
module.exports = { io };
