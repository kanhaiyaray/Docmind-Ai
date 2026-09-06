const Conversation = require('../models/Conversation');
const { processRAGQuery, processMultiDocumentRAG } = require('../services/ragService');
const Document = require('../models/Document');

// @desc    Send chat message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    console.log('📝 Chat request received');
    console.log('   req.userId:', req.userId);
    console.log('   req.body:', req.body);
    
    const { question, documentId } = req.body;

    // Validate inputs
    if (!question || !question.trim()) {
      console.log('❌ Question is empty');
      return res.status(400).json({
        success: false,
        message: 'Question is required',
      });
    }

    if (!documentId) {
      console.log('❌ Document ID is empty');
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    console.log(`🔍 Checking document: ${documentId} for user: ${req.userId}`);

    // Check if document exists and belongs to user
    const document = await Document.findOne({
      _id: documentId,
      userId: req.userId,
    });

    if (!document) {
      console.log(`❌ Document not found: ${documentId}`);
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    console.log(`📄 Document found: ${document.title}, status: ${document.status}`);

    if (document.status !== 'completed') {
      console.log(`❌ Document not ready: ${document.status}`);
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
      console.log(`🆕 Creating new conversation for document: ${documentId}`);
      conversation = new Conversation({
        userId: req.userId,
        documentId: documentId,
        title: document.title || 'Untitled',
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: question.trim(),
    });

    console.log(`🧠 Processing RAG query...`);
    const startTime = Date.now();
    
    let result;
    try {
      result = await processRAGQuery(question, documentId, req.userId);
      console.log(`✅ RAG query completed in ${Date.now() - startTime}ms`);
    } catch (ragError) {
      console.error('❌ RAG Query Error:', ragError);
      console.error('   Stack:', ragError.stack);
      // Remove the user message we added
      conversation.messages.pop();
      await conversation.save();
      
      return res.status(500).json({
        success: false,
        message: `Failed to process query: ${ragError.message}`,
        error: ragError.message,
        stack: ragError.stack,
      });
    }
    
    const processingTime = Date.now() - startTime;

    // Add assistant message with sources
    conversation.messages.push({
      role: 'assistant',
      content: result.answer || 'No response generated.',
      sources: result.sources || [],
    });

    // Update metadata
    conversation.metadata = {
      processingTime,
    };

    await conversation.save();

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources || [],
      conversationId: conversation._id,
      processingTime,
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing chat message',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

    const startTime = Date.now();
    const result = await processMultiDocumentRAG(question, documentIds, req.userId);
    const processingTime = Date.now() - startTime;

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
      sources: result.sources || [],
    });

    conversation.metadata = { processingTime };
    await conversation.save();

    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources || [],
      conversationId: conversation._id,
      processingTime,
    });
  } catch (error) {
    console.error('❌ Multi-document chat error:', error);
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
    console.error('❌ Get chat history error:', error);
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
    console.error('❌ Get conversation error:', error);
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
    console.error('❌ Delete conversation error:', error);
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
    console.error('❌ Clear chat history error:', error);
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
