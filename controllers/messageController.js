const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * Get private messages between two users
 */
const getPrivateMessages = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { userId } = req.params;
  const currentUserId = req.user.userId;
  const { page = 1, limit = 50 } = req.query;

  // Validate if the other user exists
  const otherUser = await User.findById(userId);
  if (!otherUser) {
    throw new ApiError(404, 'User not found');
  }

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId }
    ]
  })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Reverse to show oldest first
  const reversedMessages = messages.reverse();

  res.json(new ApiResponse(200, reversedMessages, 'Messages retrieved successfully'));
});

/**
 * Get group messages
 */
const getGroupMessages = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { groupId } = req.params;
  const currentUserId = req.user.userId;
  const { page = 1, limit = 50 } = req.query;

  // Validate if the group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (!group.members.includes(currentUserId)) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const messages = await Message.find({ group: groupId })
    .populate('sender', 'username avatar')
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Reverse to show oldest first
  const reversedMessages = messages.reverse();

  res.json(new ApiResponse(200, reversedMessages, 'Group messages retrieved successfully'));
});

/**
 * Get recent conversations for a user
 */
const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;
  const { limit = 10 } = req.query;

  try {
    // Get recent private conversations
    const privateConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ],
          group: { $exists: false }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', currentUserId] },
                    { $not: { $in: [currentUserId, '$readBy'] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get recent group conversations
    const groupConversations = await Message.aggregate([
      {
        $match: {
          group: { $exists: true }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$group',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', currentUserId] },
                    { $not: { $in: [currentUserId, '$readBy'] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'groups',
          localField: '_id',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $unwind: '$group'
      },
      {
        $match: {
          'group.members': currentUserId
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json(new ApiResponse(200, {
      private: privateConversations,
      groups: groupConversations
    }, 'Conversations retrieved successfully'));

  } catch (error) {
    console.error('Error in getConversations:', error);
    throw new ApiError(500, 'Failed to retrieve conversations');
  }
});

/**
 * Mark messages as read
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { messageIds } = req.body;
  const currentUserId = req.user.userId;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    throw new ApiError(400, 'messageIds must be a non-empty array');
  }

  const result = await Message.updateMany(
    {
      _id: { $in: messageIds },
      sender: { $ne: currentUserId }, // Can't mark own messages as read
      readBy: { $ne: currentUserId }  // Only update if not already read
    },
    {
      $addToSet: { readBy: currentUserId }
    }
  );

  res.json(new ApiResponse(200, {
    modifiedCount: result.modifiedCount,
    matchedCount: result.matchedCount
  }, 'Messages marked as read'));
});

/**
 * Delete a message (only by sender)
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { messageId } = req.params;
  const currentUserId = req.user.userId;

  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.sender.toString() !== currentUserId) {
    throw new ApiError(403, 'You can only delete your own messages');
  }

  await Message.findByIdAndDelete(messageId);

  res.json(new ApiResponse(200, null, 'Message deleted successfully'));
});

/**
 * Get message statistics for a user
 */
const getMessageStats = asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;

  const stats = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
          { 'group': { $exists: true } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        sentMessages: {
          $sum: {
            $cond: [{ $eq: ['$sender', currentUserId] }, 1, 0]
          }
        },
        receivedMessages: {
          $sum: {
            $cond: [{ $ne: ['$sender', currentUserId] }, 1, 0]
          }
        },
        unreadMessages: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender', currentUserId] },
                  { $not: { $in: [currentUserId, '$readBy'] } }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    unreadMessages: 0
  };

  res.json(new ApiResponse(200, result, 'Message statistics retrieved successfully'));
});

module.exports = {
  getPrivateMessages,
  getGroupMessages,
  getConversations,
  markMessagesAsRead,
  deleteMessage,
  getMessageStats
};