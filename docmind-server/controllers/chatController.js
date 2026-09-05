const Conversation = require('../models/Conversation');
const { processRAGQuery, processMultiDocumentRAG } = require('../services/ragService');
const Document = require('../models/Document');

// @desc    Send chat message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question || !documentId) {
      return res.status(400).json({
        success: false,
        message: 'Question and documentId are required',
      });
    }

    // Check if document exists and belongs to user
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

    if (document.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Document is ${document.status}. Please wait for processing to complete.`,
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      userId: req.userId,
      documentId: documentId,
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        documentId: documentId,
        title: document.title,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: question,
    });

    // Process RAG query
    const startTime = Date.now();
    const result = await processRAGQuery(question, documentId, req.userId);
    const processingTime = Date.now() - startTime;

    // Add assistant message with sources
    conversation.messages.push({
      role: 'assistant',
      content: result.answer,
      sources: result.sources,
    });

    // Update metadata
    conversation.metadata = {
      processingTime,
    };

    await conversation.save();

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      conversationId: conversation._id,
      processingTime,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing chat message',
    });
  }
};

// @desc    Multi-document chat
// @route   POST /api/chat/multi
// @access  Private
const sendMultiDocumentMessage = async (req, res) => {
  try {
    const { question, documentIds } = req.body;

    if (!question || !documentIds || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question and documentIds are required',
      });
    }

    // Process multi-document RAG
    const startTime = Date.now();
    const result = await processMultiDocumentRAG(question, documentIds, req.userId);
    const processingTime = Date.now() - startTime;

    // Save to first document's conversation
    const firstDocId = documentIds[0];
    let conversation = await Conversation.findOne({
      userId: req.userId,
      documentId: firstDocId,
    });

    if (!conversation) {
      const doc = await Document.findById(firstDocId);
      conversation = new Conversation({
        userId: req.userId,
        documentId: firstDocId,
        title: `Multi-doc: ${doc?.title || 'Documents'}`,
        messages: [],
      });
    }

    conversation.messages.push({
      role: 'user',
      content: question,
    });

    conversation.messages.push({
      role: 'assistant',
      content: result.answer,
      sources: result.sources,
    });

    conversation.metadata = { processingTime };
    await conversation.save();

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      conversationId: conversation._id,
      processingTime,
    });
  } catch (error) {
    console.error('Multi-document chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing multi-document chat',
    });
  }
};

// @desc    Get chat history
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { documentId, limit = 50 } = req.query;

    const query = { userId: req.userId };
    if (documentId) query.documentId = documentId;

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('documentId', 'title');

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/chat/:conversationId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.userId,
    }).populate('documentId', 'title filename');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/chat/:conversationId
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.conversationId,
      userId: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
    });
  }
};

// @desc    Clear chat history for a document
// @route   DELETE /api/chat/clear/:documentId
// @access  Private
const clearChatHistory = async (req, res) => {
  try {
    const result = await Conversation.deleteMany({
      userId: req.userId,
      documentId: req.params.documentId,
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} conversations`,
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
    });
  }
};

module.exports = {
  sendMessage,
  sendMultiDocumentMessage,
  getChatHistory,
  getConversation,
  deleteConversation,
  clearChatHistory,
};
