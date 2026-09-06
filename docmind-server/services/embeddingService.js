const Chunk = require('../models/Chunk');
const aiService = require('./aiService');

// Generate and store embeddings for chunks - optimized
const generateAndStoreEmbeddings = async (chunks) => {
  try {
    if (!chunks || chunks.length === 0) return [];

    const batchSize = 5;
    const embeddings = [];
    let processed = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchContents = batch.map(chunk => chunk.content);
      
      // Use AI service for embeddings
      const batchEmbeddings = await aiService.generateBatchEmbeddings(batchContents);
      embeddings.push(...batchEmbeddings);
      
      processed += batch.length;
      console.log(`🧠 Generated embeddings for ${processed}/${chunks.length} chunks`);
      
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (global.gc) {
        global.gc();
      }
    }

    const updateBatchSize = 20;
    let updated = 0;
    
    for (let i = 0; i < chunks.length; i += updateBatchSize) {
      const batch = chunks.slice(i, i + updateBatchSize);
      const updatePromises = batch.map((chunk, index) => {
        const globalIndex = i + index;
        return Chunk.findByIdAndUpdate(
          chunk._id,
          { embedding: embeddings[globalIndex] },
          { new: true }
        );
      });
      
      await Promise.all(updatePromises);
      updated += batch.length;
      console.log(`💾 Updated ${updated}/${chunks.length} chunks with embeddings`);
      
      if (global.gc) {
        global.gc();
      }
    }

    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return chunks;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

// Generate embedding for single text
const generateEmbeddingForText = async (text) => {
  try {
    return await aiService.generateEmbedding(text);
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

// Generate chat response using unified AI service
const generateChatResponse = async (prompt, context) => {
  return await aiService.generateChatResponse(prompt, context);
};

// Generate chat stream using unified AI service
const generateChatStream = async (prompt, context) => {
  return await aiService.generateChatStream(prompt, context);
};

module.exports = {
  generateAndStoreEmbeddings,
  generateEmbeddingForText,
  getChunkEmbedding,
  chunksHaveEmbeddings,
  regenerateMissingEmbeddings,
  generateChatResponse,
  generateChatStream,
};
