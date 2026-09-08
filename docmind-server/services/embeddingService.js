// docmind-server/services/embeddingService.js
const Chunk = require('../models/Chunk');
const embeddingClient = require('./embeddingClient');

// Generate and store embeddings for chunks
const generateAndStoreEmbeddings = async (chunks) => {
  if (!chunks || chunks.length === 0) return [];

  const batchSize = 20; // can adjust based on rate limits
  const embeddings = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchContents = batch.map(chunk => chunk.content);
    try {
      const batchEmbeddings = await embeddingClient.embed(batchContents);
      embeddings.push(...batchEmbeddings);
      console.log(`🧠 Generated embeddings for ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
    } catch (err) {
      console.error(`❌ Embedding batch failed at index ${i}:`, err.message);
      throw err;
    }
  }

  // Validate each embedding before saving
  const validatedEmbeddings = embeddings.map((emb, idx) => {
    if (!Array.isArray(emb) || emb.length !== 384) {
      console.warn(`⚠️ Invalid embedding at index ${idx} – expected length 384, got ${emb?.length || 'undefined'}. Skipping.`);
      return null;
    }
    // Ensure all elements are numbers
    const allNumbers = emb.every(v => typeof v === 'number' && !isNaN(v));
    if (!allNumbers) {
      console.warn(`⚠️ Embedding at index ${idx} contains non‑numeric values. Skipping.`);
      return null;
    }
    return emb;
  });

  // Update each chunk with its embedding (or null if invalid)
  const updatePromises = chunks.map((chunk, idx) => {
    const embedding = validatedEmbeddings[idx] || null;
    return Chunk.findByIdAndUpdate(chunk._id, { embedding });
  });
  await Promise.all(updatePromises);

  const storedCount = validatedEmbeddings.filter(e => e !== null).length;
  console.log(`✅ Stored ${storedCount} valid embeddings out of ${chunks.length} chunks.`);
  return chunks;
};

// Generate embedding for a single text
const generateEmbeddingForText = async (text) => {
  const result = await embeddingClient.embed(text);
  if (!result || !result[0] || !Array.isArray(result[0]) || result[0].length !== 384) {
    console.warn('⚠️ Invalid embedding generated for text, returning null.');
    return null;
  }
  return result[0];
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

// Export
module.exports = {
  generateAndStoreEmbeddings,
  generateEmbeddingForText,
  chunksHaveEmbeddings,
  regenerateMissingEmbeddings,
};
