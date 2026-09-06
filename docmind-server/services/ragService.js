const { searchDocument } = require('./vectorSearchService');
const aiService = require('./aiService');
const Document = require('../models/Document');

// Build RAG prompt
const buildRAGPrompt = (context, question) => {
  const contextText = context.map(chunk => 
    `[Page ${chunk.pageNumber}]\n${chunk.content}`
  ).join('\n\n');

  return `You are DocMind, an AI document intelligence assistant.

Your task is to answer the user's question using ONLY the provided document context.

IMPORTANT RULES:
1. Answer ONLY based on the provided context
2. If the answer is not in the context, say "I couldn't find this information in the document"
3. Always cite the source page numbers
4. Be concise and helpful
5. If multiple pages contain the answer, cite all of them
6. Do not make up information

CONTEXT:
${contextText}

USER QUESTION:
${question}

Your response should include the answer and the page numbers where the information was found.`;
};

// Process RAG query
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

    // Build context from chunks
    const context = relevantChunks.map(chunk => ({
      content: chunk.content || chunk.text || '',
      pageNumber: chunk.pageNumber || 1,
      score: chunk.score || 0,
    }));

    // Build prompt
    const prompt = buildRAGPrompt(context, question);
    console.log(`📝 Prompt built, sending to AI service...`);

    // Get response from AI service (Groq)
    let answer;
    try {
      answer = await aiService.generateChatResponse(question, prompt);
      console.log(`✅ Got response from AI service`);
    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      throw new Error(`AI service failed: ${aiError.message}`);
    }

    // Extract sources
    const sources = context.map(c => ({
      page: c.pageNumber,
      document: document.title,
      documentId: document._id,
    }));

    return {
      answer,
      sources,
      chunks: context,
    };
  } catch (error) {
    console.error('❌ RAG query error:', error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
};

// Multi-document RAG query
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

    // Build context
    const context = topChunks.map(chunk => ({
      content: chunk.content || chunk.text || '',
      pageNumber: chunk.pageNumber || 1,
      document: chunk.documentTitle,
      documentId: chunk.documentId,
    }));

    // Build multi-document prompt
    const contextText = context.map(c => 
      `[${c.document} - Page ${c.pageNumber}]\n${c.content}`
    ).join('\n\n');

    const prompt = `You are DocMind, an AI document intelligence assistant.

You are analyzing multiple documents to answer the user's question.

IMPORTANT RULES:
1. Answer based ONLY on the provided context
2. Cite which document and page number each piece of information comes from
3. If the answer is not in the context, say so
4. Compare and synthesize information from multiple documents

CONTEXT:
${contextText}

USER QUESTION:
${question}

Provide a comprehensive answer citing sources from the documents.`;

    const answer = await aiService.generateChatResponse(question, prompt);

    const sources = context.map(c => ({
      page: c.pageNumber,
      document: c.document,
      documentId: c.documentId,
    }));

    return {
      answer,
      sources,
      chunks: context,
    };
  } catch (error) {
    console.error('❌ Multi-document RAG error:', error);
    throw new Error(`Failed to process multi-document query: ${error.message}`);
  }
};

module.exports = {
  processRAGQuery,
  processMultiDocumentRAG,
  buildRAGPrompt,
};
