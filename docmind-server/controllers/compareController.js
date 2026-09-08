const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const { generateChatResponse } = require("../config/groq");

exports.compareDocuments = async (req, res) => {
  try {
    const { documentIds } = req.body;
    if (!documentIds || documentIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 document IDs are required",
      });
    }

    const docs = await Document.find({
      _id: { $in: documentIds },
      userId: req.userId,
      status: "completed",
    });

    if (docs.length !== documentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more documents not found or not ready",
      });
    }

    // Gather chunks (up to 20 per doc)
    const chunksPerDoc = await Promise.all(
      docs.map(async (doc) => {
        const chunks = await Chunk.find({ documentId: doc._id })
          .sort({ pageNumber: 1 })
          .limit(20);
        return {
          title: doc.title,
          pages: chunks.map((c) => ({
            page: c.pageNumber,
            text: c.content,
          })),
        };
      })
    );

    // Build context
    let context = "";
    chunksPerDoc.forEach((doc, idx) => {
      context += `DOCUMENT ${idx + 1}: "${doc.title}"\n`;
      doc.pages.forEach((p) => {
        context += `Page ${p.page}:\n${p.text}\n\n`;
      });
      context += "---\n";
    });

    const prompt = `
You are a comparison expert. Compare the following documents and provide a structured analysis covering:
- Main themes and topics covered in each document
- Key similarities
- Key differences
- Any complementary information

Documents:
${context}

Return your answer as a JSON object with the following keys:
- "themes": array of strings (overall themes)
- "similarities": array of strings
- "differences": array of strings
- "complementary": array of strings (how the documents complement each other)

Return ONLY the JSON object, no extra text.
`;

    const response = await generateChatResponse(prompt);
    let comparison;
    try {
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        comparison = JSON.parse(jsonMatch[0]);
      } else {
        comparison = JSON.parse(response);
      }
    } catch (err) {
      console.error("Comparison JSON parse error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response. Please try again.",
      });
    }

    // Ensure all keys exist
    const defaultKeys = ["themes", "similarities", "differences", "complementary"];
    defaultKeys.forEach((key) => {
      if (!comparison[key]) comparison[key] = [];
    });

    res.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error("Comparison error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to compare documents",
    });
  }
};