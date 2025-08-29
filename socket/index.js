const {
  handlePrivateMessage,
  handleGroupMessage,
  handleTyping,
  handleStopTyping
} = require('./messageHandler');

const {
  handleCallUser,
  handleAnswerCall,
  handleCallDeclined,
  handleEndCall,
  handleIceCandidate
} = require('./callHandler');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User joins their own room for private messages
    socket.on('join', (userId) => {
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
      // TODO: Update user's online status to false
      // This would require mapping socket.id to user ID
    });
  });
};

module.exports = setupSocket;
