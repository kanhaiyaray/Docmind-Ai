const Chunk = require('../models/Chunk');
const { generateEmbeddingForText } = require('./embeddingService');

// MongoDB Vector Search configuration
const VECTOR_SEARCH_INDEX = 'default';

// Perform vector search
const vectorSearch = async (query, documentId, limit = 5) => {
  try {
    console.log(`🔍 Vector search: query="${query}", documentId=${documentId}`);
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbeddingForText(query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }

    // Build match conditions
    const matchConditions = {};
    if (documentId) {
      matchConditions.documentId = documentId;
    }

    console.log(`📊 Match conditions:`, matchConditions);

    // Try vector search first
    try {
      const results = await Chunk.aggregate([
        {
          $vectorSearch: {
            index: VECTOR_SEARCH_INDEX,
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: limit,
            filter: matchConditions,
          },
        },
        {
          $project: {
            content: 1,
            pageNumber: 1,
            documentId: 1,
            chunkIndex: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      console.log(`✅ Vector search found ${results.length} results`);
      if (results && results.length > 0) {
        return results;
      }
    } catch (vectorError) {
      console.log('⚠️ Vector search failed, falling back to text search:', vectorError.message);
    }

    // Fallback to text search
    return await fallbackSearch(query, documentId, limit);
  } catch (error) {
    console.error('Vector search error:', error);
    return await fallbackSearch(query, documentId, limit);
  }
};

// Fallback text search
const fallbackSearch = async (query, documentId, limit = 5) => {
  try {
    console.log(`📝 Fallback text search: query="${query}"`);
    
    const keywords = query.split(/\s+/).filter(word => word.length > 2);
    
    const searchConditions = [];
    for (const keyword of keywords) {
      searchConditions.push({ content: { $regex: keyword, $options: 'i' } });
    }

    const matchConditions = {};
    if (documentId) {
      matchConditions.documentId = documentId;
    }

    let results = [];
    if (searchConditions.length > 0) {
      results = await Chunk.find({
        ...matchConditions,
        $or: searchConditions,
      })
        .limit(limit)
        .sort({ content: 1 });
    } else {
      results = await Chunk.find(matchConditions).limit(limit);
    }

    console.log(`📄 Text search found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
};

// Search within a specific document
const searchDocument = async (query, documentId, limit = 5) => {
  return await vectorSearch(query, documentId, limit);
};

// Search across all user documents
const searchAllDocuments = async (query, userId, limit = 5) => {
  return await vectorSearch(query, null, limit);
};

// Get similar chunks
const getSimilarChunks = async (chunkId, limit = 5) => {
  try {
    const chunk = await Chunk.findById(chunkId);
    if (!chunk || !chunk.embedding) {
      throw new Error('Chunk not found or has no embedding');
    }

    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_SEARCH_INDEX,
          path: 'embedding',
          queryVector: chunk.embedding,
          numCandidates: 100,
          limit: limit + 1,
          filter: {
            documentId: chunk.documentId,
            _id: { $ne: chunk._id },
          },
        },
      },
      {
        $project: {
          content: 1,
          pageNumber: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results;
  } catch (error) {
    console.error('Get similar chunks error:', error);
    return [];
  }
};

module.exports = {
  vectorSearch,
  fallbackSearch,
  searchDocument,
  searchAllDocuments,
  getSimilarChunks,
};
