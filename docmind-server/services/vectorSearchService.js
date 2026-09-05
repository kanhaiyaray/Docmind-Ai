const Chunk = require('../models/Chunk');
const { generateEmbeddingForText } = require('./embeddingService');

// MongoDB Vector Search configuration
// Note: This assumes you've created a vector search index in MongoDB Atlas
const VECTOR_SEARCH_INDEX = 'default'; // Name of your vector search index

// Perform vector search
const vectorSearch = async (query, documentId, limit = 5) => {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbeddingForText(query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }

    // Build match conditions
    const matchConditions = { documentId };

    // Perform vector search using MongoDB's $vectorSearch
    // This works if you have a vector search index on the embedding field
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

    // If no results or vector search not configured, fallback to text search
    if (!results || results.length === 0) {
      console.log('Vector search returned no results, falling back to text search');
      return await fallbackSearch(query, documentId, limit);
    }

    console.log(`✅ Vector search found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Vector search error:', error);
    // Fallback to text search
    return await fallbackSearch(query, documentId, limit);
  }
};

// Fallback text search (when vector search fails or returns no results)
const fallbackSearch = async (query, documentId, limit = 5) => {
  try {
    // Split query into keywords
    const keywords = query.split(/\s+/).filter(word => word.length > 2);
    
    // Build search conditions
    const searchConditions = [];
    for (const keyword of keywords) {
      searchConditions.push({ content: { $regex: keyword, $options: 'i' } });
    }

    const matchConditions = { documentId };

    // Search using regex
    const results = await Chunk.find({
      ...matchConditions,
      $or: searchConditions,
    })
      .limit(limit)
      .sort({ content: 1 });

    // If no results, return some chunks from the document
    if (results.length === 0 && documentId) {
      return await Chunk.find(matchConditions).limit(limit);
    }

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
  return await vectorSearch(query, { userId }, limit);
};

// Get similar chunks to a given chunk
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
