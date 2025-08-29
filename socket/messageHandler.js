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
      // Private chat typing
      socket.to(data.receiverId).emit('typing', { 
        senderId: data.senderId,
        senderName: user?.username || 'Someone'
      });
    } else if (data.groupId) {
      // Group chat typing
      socket.to(data.groupId).emit('typing', { 
        senderId: data.senderId,
        senderName: user?.username || 'Someone',
        groupId: data.groupId
      });
    }
  } catch (error) {
    console.error('Error handling typing event:', error);
  }
};

const handleStopTyping = async (io, socket, data) => {
  try {
    if (data.receiverId) {
      // Private chat stop typing
      socket.to(data.receiverId).emit('stop typing', { 
        senderId: data.senderId 
      });
    } else if (data.groupId) {
      // Group chat stop typing
      socket.to(data.groupId).emit('stop typing', { 
        senderId: data.senderId,
        groupId: data.groupId
      });
    }
  } catch (error) {
    console.error('Error handling stop typing event:', error);
  }
};

module.exports = {
  handlePrivateMessage,
  handleGroupMessage,
  handleTyping,
  handleStopTyping
};
