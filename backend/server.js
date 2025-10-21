const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const tradingRoutes = require('./routes/trading');
const leaderboardRoutes = require('./routes/leaderboard');
const uniteRoutes = require('./routes/unite');
const leagueRoutes = require('./routes/leagues');
const platformRoutes = require('./routes/platform');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store WebSocket connections
const clients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'authenticate' && data.address) {
        clients.set(data.address, ws);
        ws.address = data.address;
        console.log(`Client ${data.address} authenticated`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.address) {
      clients.delete(ws.address);
      console.log(`Client ${ws.address} disconnected`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Make WebSocket server available to routes
app.locals.wss = wss;
app.locals.clients = clients;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/unite', uniteRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/platform', platformRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connections: clients.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Fantasy Crypto API Server',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/matches', 
      '/api/trading',
      '/api/leaderboard',
      '/api/unite',
      '/api/leagues',
      '/api/platform'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({ 
    error: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Fantasy Crypto server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`WebSocket server ready`);
});

module.exports = app;