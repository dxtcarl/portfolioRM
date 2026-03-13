// ✅ Error handlers FIRST — before any require()
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err.message, err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED:', err?.message || err);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');
const sectionRoutes = require('./routes/sections');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('CLIENT_ORIGIN:', CLIENT_ORIGIN);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('CLOUDINARY exists:', !!process.env.CLOUDINARY_CLOUD_NAME);

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/experiences', require('./routes/experiences'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve built client in production (only if dist exists)
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
      if (err) res.status(404).json({ error: 'Client build not found' });
    });
  });
} else {
  console.log('⚠️  No client build found — API only mode');
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      return res.json({ message: 'API server running. No client build found.' });
    }
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Client origin: ${CLIENT_ORIGIN}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  });