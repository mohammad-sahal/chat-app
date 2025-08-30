const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

const handlePrivateMessage = async (io, socket, data) => {
  try {
    const message = new Message({
      sender: data.senderId,
      receiver: data.receiverId,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date()
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    // Emit to sender and receiver
    io.to(data.senderId).emit('private message', message);
    io.to(data.receiverId).emit('private message', message);
  } catch (error) {
    console.error('Error sending private message:', error);
  }
};

const handleGroupMessage = async (io, socket, data) => {
  try {
    const message = new Message({
      sender: data.senderId,
      group: data.groupId,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date()
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    // Get group members and emit to all of them
    const group = await Group.findById(data.groupId).populate('members');
    if (group) {
      group.members.forEach(member => {
        io.to(member._id.toString()).emit('group message', message);
      });
    }
  } catch (error) {
    console.error('Error sending group message:', error);
  }
};

const handleTyping = async (io, socket, data) => {
  try {
    // Get user info for typing indicator
    const user = await User.findById(data.senderId).select('username');
    
    if (data.receiverId) {
      // Private chat typing - send to specific user room
      socket.to(data.receiverId).emit('typing', { 
        senderId: data.senderId,
        senderName: user?.username || 'Someone',
        chatId: data.receiverId, // Include chat context
        chatType: 'user'
      });
    } else if (data.groupId) {
      // Group chat typing - send to group room, exclude sender
      socket.to(data.groupId).emit('typing', { 
        senderId: data.senderId,
        senderName: user?.username || 'Someone',
        chatId: data.groupId,
        chatType: 'group'
      });
    }
  } catch (error) {
    console.error('Error handling typing event:', error);
  }
};

const handleStopTyping = async (io, socket, data) => {
  try {
    if (data.receiverId) {
      // Private chat stop typing - send to specific user room
      socket.to(data.receiverId).emit('stop typing', { 
        senderId: data.senderId,
        chatId: data.receiverId,
        chatType: 'user'
      });
    } else if (data.groupId) {
      // Group chat stop typing - send to group room, exclude sender
      socket.to(data.groupId).emit('stop typing', { 
        senderId: data.senderId,
        chatId: data.groupId,
        chatType: 'group'
      });
    }
  } catch (error) {
    console.error('Error handling stop typing event:', error);
  }
};

const handleDeleteMessage = async (io, socket, data) => {
  try {
    const { messageId, userId } = data;
    
    // Find the message and verify ownership
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }
    
    // Only allow sender to delete their own messages
    if (message.sender.toString() !== userId) {
      socket.emit('error', { message: 'Unauthorized to delete this message' });
      return;
    }
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    // Emit deletion to all relevant users
    if (message.receiver) {
      // Private message - emit to both sender and receiver
      io.to(userId).emit('message deleted', { messageId });
      io.to(message.receiver.toString()).emit('message deleted', { messageId });
    } else if (message.group) {
      // Group message - emit to all group members
      const group = await Group.findById(message.group).populate('members');
      if (group) {
        group.members.forEach(member => {
          io.to(member._id.toString()).emit('message deleted', { messageId });
        });
      }
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    socket.emit('error', { message: 'Failed to delete message' });
  }
};

const handleMarkAsRead = async (io, socket, data) => {
  try {
    const { messageId, userId, chatId, chatType } = data;
    
    // Find and update the message
    const message = await Message.findById(messageId);
    if (!message) {
      return;
    }
    
    // Don't mark own messages as read
    if (message.sender.toString() === userId) {
      return;
    }
    
    // Add user to readBy array if not already present
    if (!message.readBy) {
      message.readBy = [];
    }
    
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
      
      // Emit read receipt to sender
      io.to(message.sender.toString()).emit('message read', { 
        messageId, 
        userId,
        chatId,
        chatType 
      });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

const handleEditMessage = async (io, socket, data) => {
  try {
    const { messageId, newContent, userId } = data;
    
    if (!newContent || !newContent.trim()) {
      socket.emit('error', { message: 'Message content cannot be empty' });
      return;
    }
    
    // Find the message and verify ownership
    const message = await Message.findById(messageId);
    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }
    
    // Only allow sender to edit their own messages
    if (message.sender.toString() !== userId) {
      socket.emit('error', { message: 'Unauthorized to edit this message' });
      return;
    }
    
    // Only allow editing text messages
    if (message.type !== 'text') {
      socket.emit('error', { message: 'Can only edit text messages' });
      return;
    }
    
    // Update the message
    message.content = newContent.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    
    // Populate sender info for the response
    await message.populate('sender', 'username avatar');
    
    // Emit edit to all relevant users
    if (message.receiver) {
      // Private message - emit to both sender and receiver
      io.to(userId).emit('message edited', { messageId, message });
      io.to(message.receiver.toString()).emit('message edited', { messageId, message });
    } else if (message.group) {
      // Group message - emit to all group members
      const group = await Group.findById(message.group).populate('members');
      if (group) {
        group.members.forEach(member => {
          io.to(member._id.toString()).emit('message edited', { messageId, message });
        });
      }
    }
  } catch (error) {
    console.error('Error editing message:', error);
    socket.emit('error', { message: 'Failed to edit message' });
  }
};

module.exports = {
  handlePrivateMessage,
  handleGroupMessage,
  handleTyping,
  handleStopTyping,
  handleDeleteMessage,
  handleMarkAsRead,
  handleEditMessage
};
