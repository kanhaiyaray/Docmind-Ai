const Chunk = require('../models/Chunk');
const { generateEmbedding, generateBatchEmbeddings } = require('../config/gemini');

// Generate and store embeddings for chunks
const generateAndStoreEmbeddings = async (chunks) => {
  try {
    if (!chunks || chunks.length === 0) return [];

    // Process embeddings in batches and save immediately to avoid memory buildup
    const batchSize = 10;
    let processedCount = 0;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const chunkBatch = chunks.slice(i, i + batchSize);
      const contents = chunkBatch.map(chunk => chunk.content);
      
      // Generate embeddings for this batch
      const batchEmbeddings = await generateBatchEmbeddings(contents);
      
      // Update chunks with embeddings immediately (don't accumulate in memory)
      const updatePromises = chunkBatch.map((chunk, index) => {
        return Chunk.findByIdAndUpdate(
          chunk._id,
          { embedding: batchEmbeddings[index] },
          { new: false } // Don't return full document to save memory
        );
      });

      await Promise.all(updatePromises);
      processedCount += chunkBatch.length;
      
      console.log(`✅ Processed ${processedCount}/${chunks.length} embeddings`);
      
      // Small delay to avoid rate limiting and give garbage collector a chance
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Explicitly clear arrays to help garbage collection
      contents.length = 0;
      batchEmbeddings.length = 0;
    }

    console.log(`✅ Generated ${processedCount} embeddings successfully`);
    return chunks;
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
  try {
    const batchSize = 50; // Process chunks in smaller batches
    let skip = 0;
    let totalProcessed = 0;
    
    while (true) {
      // Fetch chunks without embeddings in batches
      const chunks = await Chunk.find({ embedding: null })
        .skip(skip)
        .limit(batchSize)
        .lean(); // Use lean() to get plain objects (less memory)

      if (chunks.length === 0) {
        console.log(`✅ All ${totalProcessed} missing embeddings regenerated`);
        return;
      }

      console.log(`🔄 Regenerating embeddings for batch ${skip / batchSize + 1} (${chunks.length} chunks)`);
      
      // Generate embeddings for this batch
      const contents = chunks.map(chunk => chunk.content);
      const batchEmbeddings = await generateBatchEmbeddings(contents);

      // Update chunks immediately
      const updatePromises = chunks.map((chunk, index) => {
        return Chunk.findByIdAndUpdate(
          chunk._id,
          { embedding: batchEmbeddings[index] },
          { new: false }
        );
      });

      await Promise.all(updatePromises);
      totalProcessed += chunks.length;
      skip += batchSize;
      
      // Give garbage collector a chance
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Regenerate embeddings error:', error);
  }
};

module.exports = {
  generateAndStoreEmbeddings,
  generateEmbeddingForText,
  getChunkEmbedding,
  chunksHaveEmbeddings,
  regenerateMissingEmbeddings,
};
