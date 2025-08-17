const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'drfy6umhn',
  api_key: process.env.CLOUDINARY_API_KEY || '596969782927433',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vNww_xC7wuPrrNnawtNEuJSog3E'
});

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_GcrlJ48mEqrbHu',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'yosO5yOJhCnYSyn7oQUniaZz'
});

// SMTP Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'kingkite789@gmail.com',
    pass: process.env.SMTP_PASS || 'dykm hdhj zlqw kijq'
  }
});

// Import Models
const User = require('./models/User');
const Game = require('./models/Game');
const Tournament = require('./models/Tournament');
const TournamentRegistration = require('./models/TournamentRegistration');
const Post = require('./models/Post');
const Transaction = require('./models/Transaction');
const WithdrawalRequest = require('./models/WithdrawalRequest');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const tournamentRoutes = require('./routes/tournaments');
const postRoutes = require('./routes/posts');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Default route redirects to admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Admin Login Route
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Admin Test Route
app.get('/test-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-admin.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Winzone Arena API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 API URL: http://localhost:${PORT}/api`);
  console.log(`🖥️  Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

// Auto-update tournament status based on time
setInterval(async () => {
  try {
    const now = new Date();
    
    // Update upcoming to ongoing
    await Tournament.updateMany(
      { 
        status: 'upcoming', 
        dateTime: { $lte: now } 
      },
      { status: 'ongoing' }
    );
    
    // Update ongoing to completed (after 4 hours)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    await Tournament.updateMany(
      { 
        status: 'ongoing', 
        dateTime: { $lte: fourHoursAgo } 
      },
      { status: 'completed' }
    );
    
    console.log('🔄 Tournament statuses updated automatically');
  } catch (error) {
    console.error('❌ Error updating tournament statuses:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes
