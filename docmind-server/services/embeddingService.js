const Chunk = require('../models/Chunk');
const { generateEmbedding, generateBatchEmbeddings } = require('../config/gemini');

// Generate and store embeddings for chunks
const generateAndStoreEmbeddings = async (chunks) => {
  try {
    if (!chunks || chunks.length === 0) return [];

    // Extract content from chunks
    const contents = chunks.map(chunk => chunk.content);
    
    // Generate embeddings in batches to avoid rate limits
    const batchSize = 10;
    const embeddings = [];
    
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchEmbeddings = await generateBatchEmbeddings(batch);
      embeddings.push(...batchEmbeddings);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < contents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update chunks with embeddings
    const updatePromises = chunks.map((chunk, index) => {
      return Chunk.findByIdAndUpdate(
        chunk._id,
        { embedding: embeddings[index] },
        { new: true }
      );
    });

    const updatedChunks = await Promise.all(updatePromises);
    console.log(`✅ Generated ${updatedChunks.length} embeddings`);

    return updatedChunks;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

// Generate embedding for single text
const generateEmbeddingForText = async (text) => {
  try {
    return await generateEmbedding(text);
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

// Get embedding for a chunk
const getChunkEmbedding = async (chunkId) => {
  const chunk = await Chunk.findById(chunkId);
  return chunk?.embedding || null;
};

// Check if chunks have embeddings
const chunksHaveEmbeddings = async (documentId) => {
  const count = await Chunk.countDocuments({
    documentId,
    embedding: { $ne: null },
  });
  const total = await Chunk.countDocuments({ documentId });
  return count === total && total > 0;
};

// Regenerate missing embeddings
const regenerateMissingEmbeddings = async () => {
  const chunks = await Chunk.find({ embedding: null });
  
  if (chunks.length === 0) {
    console.log('✅ All chunks have embeddings');
    return;
  }

  console.log(`🔄 Regenerating embeddings for ${chunks.length} chunks`);
  await generateAndStoreEmbeddings(chunks);
};

module.exports = {
  generateAndStoreEmbeddings,
  generateEmbeddingForText,
  getChunkEmbedding,
  chunksHaveEmbeddings,
  regenerateMissingEmbeddings,
};
