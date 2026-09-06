const { searchDocument } = require('./vectorSearchService');
const aiService = require('./aiService');
const Document = require('../models/Document');

// Process RAG query – now passes raw context to aiService
const processRAGQuery = async (question, documentId, userId) => {
  try {
    console.log(`🔍 Processing RAG query for document ${documentId}`);

    // Get document info
    const document = await Document.findOne({
      _id: documentId,
      userId: userId,
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    if (document.status !== 'completed') {
      throw new Error(`Document is still ${document.status}. Please wait for processing to complete.`);
    }

    // Search for relevant chunks
    console.log(`🔍 Searching for relevant chunks...`);
    let relevantChunks;
    try {
      relevantChunks = await searchDocument(question, documentId, 5);
    } catch (searchError) {
      console.error('❌ Search error:', searchError);
      throw new Error(`Search failed: ${searchError.message}`);
    }

    console.log(`📄 Found ${relevantChunks ? relevantChunks.length : 0} relevant chunks`);

    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in this document for your question. Please try asking something else or check if the document has been properly processed.",
        sources: [],
        chunks: [],
      };
    }

    // Build raw context string (with page numbers) – this will be wrapped by groqService
    const contextText = relevantChunks.map(chunk =>
      `[Page ${chunk.pageNumber || 1}]\n${chunk.content || chunk.text || ''}`
    ).join('\n\n');

    console.log(`📝 Built raw context, sending to AI service...`);

    // Pass question and raw context – aiService will wrap it properly
    let answer;
    try {
      answer = await aiService.generateChatResponse(question, contextText);
      console.log(`✅ Got response from AI service`);
    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      throw new Error(`AI service failed: ${aiError.message}`);
    }

    // Extract sources
    const sources = relevantChunks.map(chunk => ({
      page: chunk.pageNumber || 1,
      document: document.title,
      documentId: document._id,
    }));

    return {
      answer,
      sources,
      chunks: relevantChunks.map(chunk => ({
        content: chunk.content || chunk.text || '',
        pageNumber: chunk.pageNumber || 1,
        score: chunk.score || 0,
      })),
    };
  } catch (error) {
    console.error('❌ RAG query error:', error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
};

// Multi-document RAG query – also updated to pass raw context
const processMultiDocumentRAG = async (question, documentIds, userId) => {
  try {
    // Validate all documents exist and belong to user
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId: userId,
      status: 'completed',
    });

    if (documents.length === 0) {
      throw new Error('No valid documents found');
    }

    // Get chunks from all documents
    const allChunks = [];

    for (const doc of documents) {
      const chunks = await searchDocument(question, doc._id, 3);
      allChunks.push(...chunks.map(chunk => ({
        ...chunk,
        documentTitle: doc.title,
        documentId: doc._id,
      })));
    }

    // Sort by relevance score
    allChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topChunks = allChunks.slice(0, 10);

    if (topChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the selected documents.",
        sources: [],
        chunks: [],
      };
    }

    // Build raw context with document titles and page numbers
    const contextText = topChunks.map(chunk =>
      `[${chunk.documentTitle || 'Document'} - Page ${chunk.pageNumber || 1}]\n${chunk.content || chunk.text || ''}`
    ).join('\n\n');

    // Pass raw context – aiService will wrap
    const answer = await aiService.generateChatResponse(question, contextText);

    const sources = topChunks.map(chunk => ({
      page: chunk.pageNumber || 1,
      document: chunk.documentTitle,
      documentId: chunk.documentId,
    }));

    return {
      answer,
      sources,
      chunks: topChunks.map(chunk => ({
        content: chunk.content || chunk.text || '',
        pageNumber: chunk.pageNumber || 1,
        document: chunk.documentTitle,
        score: chunk.score || 0,
      })),
    };
  } catch (error) {
    console.error('❌ Multi-document RAG error:', error);
    throw new Error(`Failed to process multi-document query: ${error.message}`);
  }
};

module.exports = {
  processRAGQuery,
  processMultiDocumentRAG,
};