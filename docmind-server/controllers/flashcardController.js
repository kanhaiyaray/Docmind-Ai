const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { generateChatResponse } = require("../config/groq");

exports.generateFlashcards = async (req, res) => {
  try {
    const { documentId, numCards = 10, includeExamples = false } = req.body;

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
    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Document has no text content. Please re-upload.",
      });
    }

    const content = chunks.map((c) => c.content).join("\n\n");

    let examplesInstruction = "";
    if (includeExamples) {
      examplesInstruction =
        "For each flashcard, also provide a short example or a practical usage context to illustrate the concept.";
    }

    const prompt = `
Based on the following document content, generate ${numCards} flashcards (question-answer pairs) that capture key concepts, definitions, or important facts.
Each flashcard should have a clear question and a concise answer.
${examplesInstruction}

Document content:
${content}

Return the flashcards as a JSON array where each object has:
{
  "question": "string",
  "answer": "string",
  "example": "string" (only if includeExamples is true, otherwise omit)
}
Return ONLY the JSON array, no extra text.
`;

    console.log("🧠 Sending prompt to Groq...");
    const response = await generateChatResponse(prompt);
    console.log("📥 Raw response:", response);

    let flashcards;
    try {
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(response);
      }
    } catch (err) {
      console.error("❌ JSON parsing error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response. Please try again.",
      });
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI returned empty or invalid flashcards.",
      });
    }

    res.json({
      success: true,
      flashcards: flashcards.slice(0, numCards),
    });
  } catch (error) {
    console.error("❌ Flashcard generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate flashcards",
    });
  }
};