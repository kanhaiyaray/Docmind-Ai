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

    // Gather chunks from each document (limit to 5 pages per doc to keep context manageable)
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

    // Build prompt for comparison
    let context = "";
    chunksPerDoc.forEach((doc, idx) => {
      context += `DOCUMENT ${idx + 1}: "${doc.title}"\n`;
      doc.pages.forEach((p) => {
        context += `Page ${p.page}:\n${p.text}\n\n`;
      });
      context += "---\n";
    });

    const prompt = `
You are a comparison expert. Compare the following documents and provide a clear, structured analysis covering:
- Main themes and topics covered in each document
- Key similarities
- Key differences
- Any complementary information

Documents:
${context}

Format the output as HTML with headings and bullet points for readability.
`;

    const comparison = await generateChatResponse(prompt);

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
