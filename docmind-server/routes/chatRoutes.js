const express = require('express');
const router = express.Router();

// Get chat history
router.get('/history', (req, res) => {
  res.status(200).json({ message: 'Chat history route - To be implemented' });
});

// Send message
router.post('/', (req, res) => {
  res.status(200).json({ message: 'Chat message route - To be implemented' });
});

module.exports = router;
