const Chunk = require('../models/Chunk');
const embeddingClient = require('./embeddingClient');

const EXPECTED_DIM = embeddingClient.getDimension();

const isValidEmbedding = (emb) => {
  if (!Array.isArray(emb)) return false;
  if (emb.length !== EXPECTED_DIM) return false;
  for (const v of emb) {
    if (typeof v !== 'number' || Number.isNaN(v)) return false;
  }
  return true;
};

const generateAndStoreEmbeddings = async (chunks) => {
  if (!chunks || chunks.length === 0) return [];

  const batchSize = 20;
  const embeddings = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchContents = batch.map((chunk) => chunk.content);
    try {
      const batchEmbeddings = await embeddingClient.embed(batchContents);
      embeddings.push(...batchEmbeddings);
      console.log(
        `🧠 Generated embeddings for ${Math.min(
          i + batchSize,
          chunks.length
        )}/${chunks.length} chunks`
      );
    } catch (err) {
      console.error(`❌ Embedding batch failed at index ${i}:`, err.message);
      throw err;
    }
  }

  const validatedEmbeddings = embeddings.map((emb, idx) => {
    if (!isValidEmbedding(emb)) {
      console.warn(
        `⚠️ Invalid embedding at index ${idx} – expected length ${EXPECTED_DIM}, got ${
          emb?.length || 'undefined'
        }. Skipping.`
      );
      return null;
    }
    return emb;
  });

  const updatePromises = chunks.map((chunk, idx) => {
    const embedding = validatedEmbeddings[idx] || null;
    return Chunk.findByIdAndUpdate(chunk._id, { embedding });
  });
  await Promise.all(updatePromises);

  const storedCount = validatedEmbeddings.filter((e) => e !== null).length;
  console.log(
    `✅ Stored ${storedCount} valid embeddings out of ${chunks.length} chunks.`
  );
  return chunks;
};

const generateEmbeddingForText = async (text) => {
  const result = await embeddingClient.embed(text);
  if (!result || !result[0] || !isValidEmbedding(result[0])) {
    console.warn('⚠️ Invalid embedding generated for text, returning null.');
    return null;
  }
  return result[0];
};

const chunksHaveEmbeddings = async (documentId) => {
  const count = await Chunk.countDocuments({
    documentId,
    embedding: { $exists: true, $ne: null },
  });
  const total = await Chunk.countDocuments({ documentId });
  return count === total && total > 0;
};

const regenerateMissingEmbeddings = async () => {
  const chunks = await Chunk.find({
    $or: [{ embedding: null }, { embedding: { $exists: false } }],
  });
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
  chunksHaveEmbeddings,
  regenerateMissingEmbeddings,
};
