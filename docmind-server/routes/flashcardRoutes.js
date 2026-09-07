const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateFlashcards } = require("../controllers/flashcardController");

router.post("/generate", protect, generateFlashcards);

module.exports = router;
