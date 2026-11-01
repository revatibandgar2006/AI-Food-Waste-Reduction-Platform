const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const ensureDatabase = require('./config/ensureDb');
const runSchema = require('./config/initSchema');
const seedDatabase = require('./seed');
const db = require('./config/db');
const { initSocket } = require('./services/socketService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const server = http.createServer(app);
app.set('etag', false);

// Initialize Real-Time Socket.io Engine
const io = initSocket(server);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() as current_time');
    res.json({
      status: 'OK',
      platform: 'foodBridge-AI Backend Engine',
      version: '1.0.0-enterprise',
      database: 'Connected (PostgreSQL foodbridge_db)',
      timestamp: dbTest.rows[0].current_time,
      socketReady: !!io,
    });
  } catch (err) {
    res.status(500).json({
      status: 'DEGRADED',
      databaseError: err.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    await ensureDatabase();
    await runSchema();
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase({ allowReset: false });
    }

    server.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(`🚀 foodBridge-AI Enterprise Server running on port ${PORT}`);
      console.log(`📡 Socket.io Real-Time Dispatch Engine initialized`);
      console.log(`🌿 ESG Impact Analytics & AI Freshness Prediction active`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('[Startup Error] Backend could not initialize:', err.message);
    await db.pool.end();
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server };
