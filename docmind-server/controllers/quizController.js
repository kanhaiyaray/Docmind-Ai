const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { generateOpenAIResponse } = require("../services/openaiService");
const ActivityLog = require("../models/ActivityLog");

exports.generateQuiz = async (req, res) => {
  try {
    const {
      documentId,
      numQuestions = 5,
      difficulty = "medium",
      questionType = "multiple-choice",
    } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "Document ID is required",
      });
    }

    const doc = await Document.findOne({
      _id: documentId,
      userId: req.userId,
      status: "completed",
    });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found or not ready",
      });
    }

    const chunks = await Chunk.find({ documentId }).limit(30);
    const content = chunks.map((c) => c.content).join("\n\n");

    // Build prompt based on difficulty and question type
    let difficultyDesc = "";
    if (difficulty === "easy") {
      difficultyDesc =
        "Ask straightforward, factual questions that test basic recall.";
    } else if (difficulty === "hard") {
      difficultyDesc =
        "Ask challenging, analytical questions that require deeper understanding and inference.";
    } else {
      difficultyDesc = "Ask a balanced mix of factual and analytical questions.";
    }

    let typeDesc = "";
    if (questionType === "true-false") {
      typeDesc =
        "Generate only true/false questions. Each question must have exactly two options: 'True' and 'False'.";
    } else if (questionType === "fill-in") {
      typeDesc =
        "Generate fill-in-the-blank questions where the user must provide a short answer. Do not provide options.";
    } else {
      typeDesc =
        "Generate multiple-choice questions with exactly 4 options (A, B, C, D).";
    }

    const prompt = `
Based on the following document content, generate ${numQuestions} ${questionType} questions to test comprehension.
Difficulty: ${difficultyDesc}
Question format: ${typeDesc}

Document content:
${content}

Return the questions as a JSON array. Each object must have:
- "question": string
- "options": array of strings (only for multiple-choice and true/false; for fill-in, omit this field or set to [])
- "correctAnswer": string (for multiple-choice, the letter A-D; for true/false, "True" or "False"; for fill-in, the exact correct answer)

Return ONLY the JSON array, no extra text.
`;

    const response = await generateOpenAIResponse(prompt);
    let questions;
    try {
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response);
      }
    } catch (err) {
      console.error("Quiz JSON parse error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response. Please try again.",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI returned an empty or invalid quiz.",
      });
    }

    // ========== LOG ACTIVITY ==========
    try {
      await ActivityLog.create({
        userId: req.userId,
        action: 'generate_quiz',
        details: { documentId, numQuestions, difficulty, questionType },
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log quiz generation:', logError);
    }

    res.json({
      success: true,
      questions: questions.slice(0, numQuestions),
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz",
    });
  }
};