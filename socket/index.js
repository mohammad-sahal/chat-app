const {
  handlePrivateMessage,
  handleGroupMessage,
  handleTyping,
  handleStopTyping,
  handleDeleteMessage,
  handleMarkAsRead,
  handleEditMessage
} = require('./messageHandler');

const {
  handleCallUser,
  handleAnswerCall,
  handleCallDeclined,
  handleEndCall,
  handleIceCandidate,
  handleUserDisconnect
} = require('./callHandler');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User joins their own room for private messages
    socket.on('join', (userId) => {
      socket.userId = userId; // Store user ID in socket for call handling
      socket.join(userId);
      console.log(`👤 User ${userId} joined room ${userId}`);
      console.log(`📋 Active rooms for ${socket.id}:`, Array.from(socket.rooms));
    });

    // Join group room
    socket.on('join group', (groupId) => {
      socket.join(groupId);
      console.log(`👥 User joined group room: ${groupId}`);
    });

    // Leave group room
    socket.on('leave group', (groupId) => {
      socket.leave(groupId);
      console.log(`👋 User left group room: ${groupId}`);
    });

    // Message handling
    socket.on('private message', (data) => {
      console.log('💬 Private message received:', data);
      handlePrivateMessage(io, socket, data);
    });

    socket.on('group message', (data) => {
      console.log('👥 Group message received:', data);
      handleGroupMessage(io, socket, data);
    });

    // Typing indicators
    socket.on('typing', (data) => {
      handleTyping(io, socket, data);
    });

    socket.on('stop typing', (data) => {
      handleStopTyping(io, socket, data);
    });

    // Message management
    socket.on('delete message', (data) => {
      console.log('🗑️ Delete message received:', data);
      handleDeleteMessage(io, socket, data);
    });

    socket.on('mark as read', (data) => {
      console.log('👁️ Mark as read received:', data);
      handleMarkAsRead(io, socket, data);
    });

    socket.on('edit message', (data) => {
      console.log('✏️ Edit message received:', data);
      handleEditMessage(io, socket, data);
    });

    // WebRTC call handling
    socket.on('call user', (data) => {
      console.log('📞 Call user event received on server:', data);
      handleCallUser(io, socket, data);
    });

    socket.on('answer call', (data) => {
      console.log('✅ Answer call event received on server:', data);
      handleAnswerCall(io, socket, data);
    });

    socket.on('call declined', (data) => {
      console.log('❌ Call declined event received on server:', data);
      handleCallDeclined(io, socket, data);
    });

    socket.on('end call', (data) => {
      console.log('🔚 End call event received on server:', data);
      handleEndCall(io, socket, data);
    });

    socket.on('ice candidate', (data) => {
      console.log('🧊 ICE candidate event received on server:', data);
      handleIceCandidate(io, socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('🔌 User disconnected:', socket.id);
      
      // Handle call cleanup on disconnect
      handleUserDisconnect(io, socket);
      
      // TODO: Update user's online status to false
      if (socket.userId) {
        console.log(`👋 User ${socket.userId} went offline`);
        // Broadcast to other users that this user went offline
        socket.broadcast.emit('user offline', { userId: socket.userId });
      }
    });
  });
};

module.exports = setupSocket;
