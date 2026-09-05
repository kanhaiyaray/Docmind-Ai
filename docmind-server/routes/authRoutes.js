const express = require('express');
const router = express.Router();

// Register
router.post('/register', (req, res) => {
  res.status(200).json({ message: 'Register route - To be implemented' });
});

// Login
router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Login route - To be implemented' });
});

// Get current user
router.get('/me', (req, res) => {
  res.status(200).json({ message: 'Get user route - To be implemented' });
});

module.exports = router;
