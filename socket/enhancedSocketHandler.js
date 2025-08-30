const SocketManager = require('./socketManager');
const {
  handlePrivateMessage,
  handleGroupMessage,
  handleTyping,
  handleStopTyping,
  handleDeleteMessage,
  handleMarkAsRead
} = require('./messageHandler');
const {
  handleCallUser,
  handleAnswerCall,
  handleCallDeclined,
  handleEndCall,
  handleIceCandidate,
  handleUserDisconnect
} = require('./callHandler');

class EnhancedSocketHandler {
  constructor() {
    this.socketManager = new SocketManager();
    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Message events
    this.eventHandlers.set('private message', this.handlePrivateMessage.bind(this));
    this.eventHandlers.set('group message', this.handleGroupMessage.bind(this));
    this.eventHandlers.set('delete message', this.handleDeleteMessage.bind(this));
    this.eventHandlers.set('mark as read', this.handleMarkAsRead.bind(this));
    
    // Typing events
    this.eventHandlers.set('typing', this.handleTyping.bind(this));
    this.eventHandlers.set('stop typing', this.handleStopTyping.bind(this));
    
    // Call events
    this.eventHandlers.set('call user', this.handleCallUser.bind(this));
    this.eventHandlers.set('answer call', this.handleAnswerCall.bind(this));
    this.eventHandlers.set('call declined', this.handleCallDeclined.bind(this));
    this.eventHandlers.set('end call', this.handleEndCall.bind(this));
    this.eventHandlers.set('ice candidate', this.handleIceCandidate.bind(this));
    
    // Room events
    this.eventHandlers.set('join group', this.handleJoinGroup.bind(this));
    this.eventHandlers.set('leave group', this.handleLeaveGroup.bind(this));
  }

  setupSocket(io) {
    // Socket authentication middleware
    io.use((socket, next) => {
      this.socketManager.authenticateSocket(socket, next);
    });

    io.on('connection', (socket) => {
      try {
        // Handle connection
        this.socketManager.handleConnection(socket);

        // Register all event handlers
        this.eventHandlers.forEach((handler, event) => {
          socket.on(event, async (data) => {
            try {
              await handler(io, socket, data);
            } catch (error) {
              console.error(`Error handling ${event}:`, error);
              socket.emit('error', {
                event,
                message: error.message || 'Internal server error',
                code: error.code || 'SOCKET_ERROR'
              });
            }
          });
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
          console.log(`🔌 Socket ${socket.id} disconnected: ${reason}`);
          this.socketManager.handleDisconnection(socket);
          handleUserDisconnect(io, socket);
        });

        // Handle connection errors
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

      } catch (error) {
        console.error('Error setting up socket:', error);
        socket.disconnect(true);
      }
    });

    // Global error handler
    io.engine.on('connection_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });

    console.log('🔌 Enhanced Socket.IO server initialized');
  }

  // Event handler methods
  async handlePrivateMessage(io, socket, data) {
    const validation = this.validateMessageData(data, 'private');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    await handlePrivateMessage(io, socket, data);
  }

  async handleGroupMessage(io, socket, data) {
    const validation = this.validateMessageData(data, 'group');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    await handleGroupMessage(io, socket, data);
  }

  async handleDeleteMessage(io, socket, data) {
    if (!data.messageId) {
      throw new Error('Message ID is required');
    }
    
    await handleDeleteMessage(io, socket, data);
  }

  async handleMarkAsRead(io, socket, data) {
    if (!data.messageId) {
      throw new Error('Message ID is required');
    }
    
    await handleMarkAsRead(io, socket, data);
  }

  async handleTyping(io, socket, data) {
    await handleTyping(io, socket, data);
  }

  async handleStopTyping(io, socket, data) {
    await handleStopTyping(io, socket, data);
  }

  async handleCallUser(io, socket, data) {
    const validation = this.validateCallData(data);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    await handleCallUser(io, socket, data);
  }

  async handleAnswerCall(io, socket, data) {
    await handleAnswerCall(io, socket, data);
  }

  async handleCallDeclined(io, socket, data) {
    await handleCallDeclined(io, socket, data);
  }

  async handleEndCall(io, socket, data) {
    await handleEndCall(io, socket, data);
  }

  async handleIceCandidate(io, socket, data) {
    await handleIceCandidate(io, socket, data);
  }

  async handleJoinGroup(io, socket, data) {
    if (!data.groupId) {
      throw new Error('Group ID is required');
    }
    
    this.socketManager.joinGroup(socket, data.groupId);
  }

  async handleLeaveGroup(io, socket, data) {
    if (!data.groupId) {
      throw new Error('Group ID is required');
    }
    
    this.socketManager.leaveGroup(socket, data.groupId);
  }

  // Validation methods
  validateMessageData(data, type) {
    if (!data.senderId) {
      return { isValid: false, error: 'Sender ID is required' };
    }
    
    if (!data.content || data.content.trim() === '') {
      return { isValid: false, error: 'Message content is required' };
    }
    
    if (type === 'private' && !data.receiverId) {
      return { isValid: false, error: 'Receiver ID is required for private messages' };
    }
    
    if (type === 'group' && !data.groupId) {
      return { isValid: false, error: 'Group ID is required for group messages' };
    }
    
    return { isValid: true };
  }

  validateCallData(data) {
    if (!data.from || !data.to) {
      return { isValid: false, error: 'Caller and callee IDs are required' };
    }
    
    if (!data.callType || !['voice', 'video'].includes(data.callType)) {
      return { isValid: false, error: 'Valid call type (voice/video) is required' };
    }
    
    return { isValid: true };
  }

  // Utility methods
  getSocketManager() {
    return this.socketManager;
  }

  getConnectedUsers() {
    return this.socketManager.getConnectedUsers();
  }

  isUserOnline(userId) {
    return this.socketManager.isUserOnline(userId);
  }
}

module.exports = EnhancedSocketHandler;