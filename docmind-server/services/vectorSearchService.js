const mongoose = require('mongoose');
const Chunk = require('../models/Chunk');
const { generateEmbeddingForText } = require('./embeddingService');

const VECTOR_SEARCH_INDEX = 'default';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const vectorSearch = async (query, documentId, limit = 5, userId = null) => {
  try {
    console.log(`🔍 Vector search: query="${query}", documentId=${documentId}`);

    const queryEmbedding = await generateEmbeddingForText(query);
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error('Failed to generate query embedding');
    }

    const matchConditions = {};
    if (documentId) {
      matchConditions.documentId = new mongoose.Types.ObjectId(documentId);
    }
    if (userId) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

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
            userId: 1,
            chunkIndex: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      console.log(`✅ Vector search found ${results.length} results`);
      if (results && results.length > 0) return results;
    } catch (vectorError) {
      console.error(
        '⚠️ Vector search failed (check Atlas index name):',
        vectorError.message
      );
      console.log('Falling back to text search...');
    }

    return await fallbackSearch(query, documentId, limit, userId);
  } catch (error) {
    console.error('Vector search error:', error);
    return await fallbackSearch(query, documentId, limit, userId);
  }
};

const fallbackSearch = async (query, documentId, limit = 5, userId = null) => {
  try {
    console.log(`📝 Fallback text search: query="${query}"`);

    const keywords = query
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map(escapeRegex);

    const searchConditions = keywords.map((kw) => ({
      content: { $regex: kw, $options: 'i' },
    }));

    const matchConditions = {};
    if (documentId) matchConditions.documentId = documentId;
    if (userId) matchConditions.userId = userId;

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

const searchDocument = async (query, documentId, limit = 5, userId = null) => {
  return await vectorSearch(query, documentId, limit, userId);
};

const searchAllDocuments = async (query, userId, limit = 5) => {
  return await vectorSearch(query, null, limit, userId);
};

const getSimilarChunks = async (chunkId, limit = 5) => {
  try {
    const chunk = await Chunk.findById(chunkId);
    if (!chunk || !chunk.embedding || chunk.embedding.length === 0) {
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
            documentId: new mongoose.Types.ObjectId(chunk.documentId),
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
