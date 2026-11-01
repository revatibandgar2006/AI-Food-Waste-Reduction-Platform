/**
 * foodBridge-AI: Real-Time Socket.io Dispatch Notification Engine
 * 
 * Provides instantaneous volunteer dispatch alerts, live pickup coordination,
 * secure OTP handoff alerts, and real-time ESG metrics broadcast.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow frontend Vite client and local development
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    pingTimeout: 60000,
  });

  // Authentication & room assignment middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'foodbridge_award_winning_secret_key_2026'
      );
      socket.user = decoded;
      return next();
    } catch (err) {
      console.warn('[Socket.io] Invalid auth token on socket connection:', err.message);
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (User: ${socket.user?.id || 'Guest'})`);

    // Join user-specific private room
    if (socket.user?.id) {
      const userRoom = `user:${socket.user.id}`;
      socket.join(userRoom);

      // Join role-specific broadcast room
      if (socket.user.role) {
        const roleRoom = `role:${socket.user.role.toUpperCase()}`;
        socket.join(roleRoom);
        console.log(`[Socket.io] User ${socket.user.id} joined rooms: ${userRoom}, ${roleRoom}`);
      }
    }

    socket.on('volunteer_location_update', (coords) => {
      // Broadcast volunteer live GPS location to relevant admin/receivers
      if (
        socket.user?.id &&
        socket.user.role === 'VOLUNTEER' &&
        Number.isFinite(coords?.latitude) &&
        Number.isFinite(coords?.longitude) &&
        Math.abs(coords.latitude) <= 90 &&
        Math.abs(coords.longitude) <= 180
      ) {
        io.to('role:ADMIN').emit('volunteer_moved', {
          volunteerId: socket.user.id,
          coords,
          timestamp: new Date(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet. Call initSocket(server) first.');
  }
  return io;
}

/**
 * Broadcast new food donation dispatch alert to all online volunteers.
 */
function broadcastDonationAlert(donation) {
  if (!io) return;
  console.log(`[Socket.io Dispatch] Broadcasting donation #${donation.id} to VOLUNTEERS...`);
  
  io.to('role:VOLUNTEER').emit('donation:new_available', {
    donation,
    timestamp: new Date(),
    title: '🚨 Urgent Rescue Opportunity!',
    message: `${donation.food_name} (${donation.quantity_display}) available at ${donation.pickup_location}. Freshness score: ${donation.freshness_score}%.`,
    urgencyLevel: donation.urgency_level || 'NORMAL',
  });

  // Also broadcast to receivers
  io.to('role:RECEIVER').emit('donation:new_available', {
    donation,
    timestamp: new Date(),
  });
}

/**
 * Emit event directly to a targeted user.
 */
function notifyUser(userId, event, payload) {
  if (!io) return;
  const userRoom = `user:${userId}`;
  io.to(userRoom).emit(event, payload);
}

/**
 * Broadcast pickup status update.
 */
function broadcastPickupUpdate(pickupData) {
  if (!io) return;
  io.emit('pickup:status_updated', pickupData);
}

/**
 * Broadcast delivery status update.
 */
function broadcastDeliveryUpdate(deliveryData) {
  if (!io) return;
  io.emit('delivery:status_updated', deliveryData);
}

module.exports = {
  initSocket,
  getIO,
  broadcastDonationAlert,
  notifyUser,
  broadcastPickupUpdate,
  broadcastDeliveryUpdate,
};

