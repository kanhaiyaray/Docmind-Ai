const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { generateChatResponse } = require('../config/gemini');

// @desc    Generate document summary
// @route   POST /api/documents/summary
// @access  Private
exports.generateSummary = async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }
    
    const document = await Document.findOne({
      _id: documentId,
      userId: req.userId,
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Get all chunks for the document
    const chunks = await Chunk.find({ documentId }).sort({ pageNumber: 1 });
    const fullText = chunks.map(c => c.content).join('\n\n');
    
    if (!fullText || fullText.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Document content is too short for summarization',
      });
    }
    
    // Generate summary using Gemini
    const prompt = `Summarize the following document concisely. Focus on the main points, key findings, and conclusions.\n\n${fullText.substring(0, 15000)}`;
    const summary = await generateChatResponse(prompt);
    
    // Save summary to document
    document.summary = summary;
    await document.save();
    
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary',
    });
  }
};

// @desc    Suggest questions
// @route   POST /api/documents/suggest-questions
// @access  Private
exports.suggestQuestions = async (req, res) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }
    
    const document = await Document.findOne({
      _id: documentId,
      userId: req.userId,
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    const chunks = await Chunk.find({ documentId }).limit(20);
    const context = chunks.map(c => c.content).join('\n\n');
    
    if (!context || context.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Document content is too short for generating questions',
      });
    }
    
    const prompt = `Based on the following document content, generate 5 insightful questions a user might ask about this document. Make them diverse and cover different aspects. Return only the questions, one per line, numbered.\n\n${context.substring(0, 10000)}`;
    const response = await generateChatResponse(prompt);
    
    // Parse questions from response
    const questions = response
      .split('\n')
      .filter(line => line.trim().startsWith('?') || line.trim().match(/^\d+\./) || line.trim().match(/^[A-Z]/))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^\?\s*/, '').trim())
      .filter(q => q.length > 5 && q.length < 200);
    
    res.json({
      success: true,
      questions: questions.slice(0, 5),
    });
  } catch (error) {
    console.error('Suggest questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
    });
  }
};
