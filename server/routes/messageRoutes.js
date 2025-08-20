const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Apply protect middleware to all routes
router.use(protect);

// @desc    Send a new message
// @route   POST /api/messages
router.post('/', messageController.sendMessage);

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
router.get('/conversations', messageController.getConversations);

// @desc    Get messages for a specific conversation
// @route   GET /api/messages/conversation/:conversationId
// @query   page - Page number (default: 1)
// @query   limit - Messages per page (default: 20)
router.get('/conversation/:conversationId', messageController.getConversationMessages);

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
