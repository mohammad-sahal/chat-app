const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

class SocketManager {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map();    // socketId -> userId
  }

  /**
   * Authenticate socket connection
   */
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const cleanToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(cleanToken, config.jwtSecret);
      
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  }

  /**
   * Handle user connection
   */
  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    this.userSockets.set(socket.id, userId);

    console.log(`✅ User ${userId} connected with socket ${socket.id}`);
    
    // Join user's personal room
    socket.join(userId);
    
    // Update user online status
    this.updateUserStatus(userId, true);
    
    // Broadcast to friends that user is online
    this.broadcastUserStatus(socket, userId, true);
  }

  /**
   * Handle user disconnection
   */
  handleDisconnection(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      // Remove from tracking maps
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      console.log(`❌ User ${userId} disconnected`);
      
      // Update user offline status
      this.updateUserStatus(userId, false);
      
      // Broadcast to friends that user is offline
      this.broadcastUserStatus(socket, userId, false);
    }
  }

  /**
   * Join group room
   */
  joinGroup(socket, groupId) {
    socket.join(groupId);
    console.log(`👥 User ${socket.userId} joined group: ${groupId}`);
  }

  /**
   * Leave group room
   */
  leaveGroup(socket, groupId) {
    socket.leave(groupId);
    console.log(`👋 User ${socket.userId} left group: ${groupId}`);
  }

  /**
   * Get socket by user ID
   */
  getSocketByUserId(userId) {
    const socketId = this.connectedUsers.get(userId);
    return socketId ? { id: socketId } : null;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Update user online status in database
   */
  async updateUserStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  /**
   * Broadcast user status to friends/contacts
   */
  broadcastUserStatus(socket, userId, isOnline) {
    // This would typically involve finding user's contacts/friends
    // and broadcasting their status change
    socket.broadcast.emit('user status', {
      userId,
      isOnline,
      timestamp: new Date()
    });
  }

  /**
   * Emit to specific user
   */
  emitToUser(io, userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Emit to multiple users
   */
  emitToUsers(io, userIds, event, data) {
    const results = [];
    for (const userId of userIds) {
      results.push(this.emitToUser(io, userId, event, data));
    }
    return results;
  }
}

module.exports = SocketManager;