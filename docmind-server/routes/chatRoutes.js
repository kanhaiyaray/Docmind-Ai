const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  sendMultiDocumentMessage,
  getChatHistory,
  getConversation,
  deleteConversation,
  clearChatHistory,
} = require('../controllers/chatController');

// All routes are protected
router.use(protect);

// Send message (single document)
router.post('/', sendMessage);

// Send message (multiple documents)
router.post('/multi', sendMultiDocumentMessage);

// Get chat history
router.get('/history', getChatHistory);

// Get single conversation
router.get('/:conversationId', getConversation);

// Delete conversation
router.delete('/:conversationId', deleteConversation);

// Clear chat history for a document
router.delete('/clear/:documentId', clearChatHistory);

module.exports = router;
