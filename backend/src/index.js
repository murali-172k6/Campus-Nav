import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import os from 'os';
import { findShortestPath, getGraphData } from './routing.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set Mongoose global options to help with debugging
mongoose.set('bufferCommands', false); 

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, 
    family: 4, // Force IPv4 to avoid Windows localhost/::1 bind issues
}).then(() => console.log('✅ MongoDB Connected successfully.'))
  .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      console.log('TIP: Ensure MongoDB is running locally on port 27017.');
  });

// Handle connection errors after initial connect
mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
});

// Core Navigation API
app.get('/api/graph', (req, res) => {
    res.json(getGraphData());
});

app.post('/api/route', (req, res) => {
    const { startNode, endNode, optimization = 'fastest', wheelchair = false } = req.body;
    if (!startNode || !endNode) {
        return res.status(400).json({ error: 'Missing startNode or endNode' });
    }
    const result = findShortestPath(startNode, endNode, { optimization, wheelchair });
    if (result.error) {
        return res.status(404).json(result);
    }
    res.json(result);
});

// Mounted Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // User & Admin routes

// Mock route fallbacks for old Dashboard compatibility
app.post('/api/feedback', (req, res) => {
    return res.status(200).json({ message: 'Feedback saved remotely' });
});

app.get('/api/stats', (req, res) => {
    return res.json({
        totalSearches: 1245,
        mostVisited: ["Canteen", "TKEM Campus", "Hostel Entrance"],
        wheelchairRequests: 42,
        activeUsers: 8
    });
});

const PORT = process.env.PORT || 5001;

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`\n🚀 Smart Campus Backend is LIVE!`);
    console.log(`-------------------------------------------`);
    console.log(`🏠 Local:   http://localhost:${PORT}`);
    console.log(`📱 Network: http://${ip}:${PORT}`);
    console.log(`-------------------------------------------`);
    console.log(`Tip: Use the Network URL above on your phone.\n`);
});


