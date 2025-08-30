const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const {
  getPrivateMessages,
  getGroupMessages,
  getConversations,
  markMessagesAsRead,
  deleteMessage,
  getMessageStats
} = require('../controllers/messageController');
const {
  validateGetPrivateMessages,
  validateGetGroupMessages,
  validateMarkAsRead,
  validateDeleteMessage,
  validateGetConversations
} = require('../validators/messageValidator');

const router = express.Router();

// Rate limiting for message operations
const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many message requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication to all routes
router.use(authenticateToken);

// Apply rate limiting to all routes
router.use(messageRateLimit);

/**
 * @route   GET /api/messages/private/:userId
 * @desc    Get private messages between current user and specified user
 * @access  Private
 * @params  userId - MongoDB ObjectId of the other user
 * @query   page - Page number (optional, default: 1)
 * @query   limit - Number of messages per page (optional, default: 50, max: 100)
 */
router.get('/private/:userId', validateGetPrivateMessages, getPrivateMessages);

/**
 * @route   GET /api/messages/group/:groupId
 * @desc    Get messages from a specific group
 * @access  Private
 * @params  groupId - MongoDB ObjectId of the group
 * @query   page - Page number (optional, default: 1)
 * @query   limit - Number of messages per page (optional, default: 50, max: 100)
 */
router.get('/group/:groupId', validateGetGroupMessages, getGroupMessages);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get recent conversations for the current user
 * @access  Private
 * @query   limit - Number of conversations to return (optional, default: 10, max: 50)
 */
router.get('/conversations', validateGetConversations, getConversations);

/**
 * @route   GET /api/messages/stats
 * @desc    Get message statistics for the current user
 * @access  Private
 */
router.get('/stats', getMessageStats);

/**
 * @route   POST /api/messages/mark-read
 * @desc    Mark multiple messages as read
 * @access  Private
 * @body    messageIds - Array of MongoDB ObjectIds
 */
router.post('/mark-read', validateMarkAsRead, markMessagesAsRead);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message (only by sender)
 * @access  Private
 * @params  messageId - MongoDB ObjectId of the message
 */
router.delete('/:messageId', validateDeleteMessage, deleteMessage);

module.exports = router;