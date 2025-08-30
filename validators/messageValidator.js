const { body, param, query } = require('express-validator');

const validateGetPrivateMessages = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateGetGroupMessages = [
  param('groupId')
    .isMongoId()
    .withMessage('Invalid group ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateMarkAsRead = [
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('messageIds must be a non-empty array'),
  body('messageIds.*')
    .isMongoId()
    .withMessage('Each message ID must be a valid MongoDB ObjectId')
];

const validateDeleteMessage = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID format')
];

const validateGetConversations = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

module.exports = {
  validateGetPrivateMessages,
  validateGetGroupMessages,
  validateMarkAsRead,
  validateDeleteMessage,
  validateGetConversations
};