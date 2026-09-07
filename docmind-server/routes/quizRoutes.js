const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateQuiz } = require("../controllers/quizController");

router.post("/generate", protect, generateQuiz);

module.exports = router;
