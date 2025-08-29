const express = require('express');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get private messages between two users
router.get('/private/:userId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.userId }
      ]
    })
    .populate('sender', 'username avatar')
    .sort({ timestamp: 1 })
    .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group messages
router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate('sender', 'username avatar')
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    // Get recent private conversations
    const privateMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user.userId },
            { receiver: req.user.userId }
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
              { $eq: ['$sender', req.user.userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $limit: 10
      }
    ]);

    // Get recent group conversations
    const groupMessages = await Message.aggregate([
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
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      private: privateMessages,
      groups: groupMessages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
