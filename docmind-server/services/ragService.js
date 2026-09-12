const { searchDocument } = require('./vectorSearchService');
const aiService = require('./aiService');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');

// Adaptive strategy based on document size
const SMALL_DOC_CHUNKS = 30;      // send all chunks
const MEDIUM_DOC_CHUNKS = 200;    // vector top-15
const LARGE_DOC_TOP_K = 15;
const MAX_CONTEXT_CHARS = 60000;  // hard cap so we never blow the token budget

const buildContext = (chunks) => {
  let out = '';
  const total = chunks.length;
  for (let i = 0; i < total; i++) {
    const c = chunks[i];
    const block =
      `===== [POSITION ${i + 1} of ${total} | Page ${c.pageNumber || 1}] =====\n` +
      `${c.content || c.text || ''}\n\n`;
    if (out.length + block.length > MAX_CONTEXT_CHARS) {
      out += `\n[NOTE: document context truncated at ${i} of ${total} chunks due to size]\n`;
      break;
    }
    out += block;
  }
  return out;
};

const processRAGQuery = async (question, documentId, userId) => {
  try {
    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) throw new Error('Document not found or access denied');
    if (document.status !== 'completed') {
      throw new Error(`Document is still ${document.status}. Please wait.`);
    }

    const totalChunks = await Chunk.countDocuments({ documentId });
    let relevantChunks;

    if (totalChunks <= SMALL_DOC_CHUNKS) {
      console.log(`📄 Small doc (${totalChunks} chunks) -> ALL chunks`);
      relevantChunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).limit(100);
    } else if (totalChunks <= MEDIUM_DOC_CHUNKS) {
      console.log(`📄 Medium doc (${totalChunks} chunks) -> vector top-${LARGE_DOC_TOP_K}`);
      relevantChunks = await searchDocument(question, documentId, LARGE_DOC_TOP_K, userId);
    } else {
      console.log(`📄 Large doc (${totalChunks} chunks) -> vector top-${LARGE_DOC_TOP_K}`);
      relevantChunks = await searchDocument(question, documentId, LARGE_DOC_TOP_K, userId);
    }

    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in this document.",
        sources: [],
        chunks: [],
      };
    }

    const contextText = buildContext(relevantChunks);
    const answer = await aiService.generateChatResponse(question, contextText);

    const seenPages = new Set();
    const sources = [];
    for (const chunk of relevantChunks) {
      const page = chunk.pageNumber || 1;
      const key = `${document._id}-${page}`;
      if (!seenPages.has(key)) {
        seenPages.add(key);
        sources.push({ page, document: document.title, documentId: document._id });
      }
    }

    return { answer, sources, chunks: relevantChunks };
  } catch (error) {
    console.error('❌ RAG query error:', error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
};

const processMultiDocumentRAG = async (question, documentIds, userId) => {
  try {
    const documents = await Document.find({
      _id: { $in: documentIds },
      userId,
      status: 'completed',
    });
    if (documents.length === 0) throw new Error('No valid documents found');

    const allChunks = [];
    for (const doc of documents) {
      const docTotalChunks = await Chunk.countDocuments({ documentId: doc._id });
      let chunks;
      if (docTotalChunks <= SMALL_DOC_CHUNKS) {
        chunks = await Chunk.find({ documentId: doc._id }).sort({ chunkIndex: 1 }).limit(50);
      } else {
        chunks = await searchDocument(question, doc._id, 5, userId);
      }
      allChunks.push(
        ...chunks.map((chunk) => ({
          ...chunk._doc,
          documentTitle: doc.title,
          documentId: doc._id,
        }))
      );
    }

    allChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topChunks = allChunks.slice(0, 20);

    if (topChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the selected documents.",
        sources: [],
        chunks: [],
      };
    }

    const contextText = buildContext(
      topChunks.map((c) => ({ ...c, pageNumber: c.pageNumber, content: `[${c.documentTitle}] ${c.content}` }))
    );
    const answer = await aiService.generateChatResponse(question, contextText);

    const sources = topChunks.map((chunk) => ({
      page: chunk.pageNumber || 1,
      document: chunk.documentTitle,
      documentId: chunk.documentId,
    }));

    return { answer, sources, chunks: topChunks };
  } catch (error) {
    console.error('❌ Multi-document RAG error:', error);
    throw new Error(`Failed to process multi-document query: ${error.message}`);
  }
};

module.exports = { processRAGQuery, processMultiDocumentRAG };