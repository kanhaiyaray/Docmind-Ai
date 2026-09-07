const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { generateChatResponse } = require("../config/groq");

exports.generateQuiz = async (req, res) => {
  try {
    const { documentId, numQuestions = 5 } = req.body;
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
    const content = chunks.map(c => c.content).join("\n\n");

    const prompt = `
Based on the following document content, generate ${numQuestions} multiple-choice questions to test comprehension.
Each question must have exactly 4 options (A, B, C, D) and one correct answer.

Document content:
${content}

Return the questions as a JSON array where each object has:
{
  "question": "string",
  "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
  "correctAnswer": "A" (the letter of the correct option)
}
Return only the JSON array, no extra text.
`;

    const response = await generateChatResponse(prompt);
    let questions;
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (err) {
      // Fallback: try to parse entire response
      questions = JSON.parse(response);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse quiz questions",
      });
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
