const Chunk = require('../models/Chunk');

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 800;
const OVERLAP = parseInt(process.env.OVERLAP) || 150;

const chunkDocument = async (documentId, userId, pages) => {
  try {
    const insertBatchSize = 50;
    let chunkIndex = 0;
    let totalChunks = 0;
    let chunks = [];

    for (const page of pages) {
      const pageText = page.text;
      const pageNumber = page.pageNumber;

      const pageChunks = splitTextIntoChunks(pageText, CHUNK_SIZE, OVERLAP);
      console.log(`   Page ${pageNumber}: ${pageText.length} chars -> ${pageChunks.length} chunks`);

      for (const chunkText of pageChunks) {
        if (!chunkText.trim()) continue;

        chunks.push({
          documentId,
          userId,
          content: chunkText.trim(),
          pageNumber,
          chunkIndex: chunkIndex++,
          metadata: {
            filename: '',
            pageNumber,
            chunkSize: chunkText.length,
          },
          charCount: chunkText.length,
          wordCount: chunkText.split(/\s+/).length,
        });

        if (chunks.length >= insertBatchSize) {
          await Chunk.insertMany(chunks);
          totalChunks += chunks.length;
          chunks = [];
        }
      }
    }

    if (chunks.length > 0) {
      await Chunk.insertMany(chunks);
      totalChunks += chunks.length;
    }

    console.log(`✅ Created ${totalChunks} total chunks for document ${documentId}`);
    return totalChunks;
  } catch (error) {
    console.error('Chunking error:', error);
    throw new Error(`Failed to chunk document: ${error.message}`);
  }
};

const splitTextIntoChunks = (text, chunkSize, overlap) => {
  if (!text || text.length === 0) return [];

  const cleanedText = text.replace(/\s+/g, ' ').trim();
  if (cleanedText.length <= chunkSize) return [cleanedText];

  // Guaranteed advance step: never smaller than 1
  const step = Math.max(chunkSize - overlap, 1);
  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to end on a sentence boundary within the last 120 chars
    if (end < cleanedText.length) {
      const windowStart = Math.max(end - 120, start + Math.floor(chunkSize / 2));
      const window = cleanedText.substring(windowStart, end);
      const period = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('? '),
        window.lastIndexOf('! ')
      );
      if (period > 0) {
        end = windowStart + period + 1;
      }
    }

    const chunk = cleanedText.substring(start, end).trim();
    if (chunk) chunks.push(chunk);

    // Always advance by `step` — this is the fix
    start += step;
  }

  return chunks;
};

const getDocumentChunks = async (documentId) => {
  return await Chunk.find({ documentId }).sort({ chunkIndex: 1 });
};

const getChunksByPage = async (documentId, pageNumber) => {
  return await Chunk.find({ documentId, pageNumber }).sort({ chunkIndex: 1 });
};

const deleteDocumentChunks = async (documentId) => {
  return await Chunk.deleteMany({ documentId });
};

const getChunkCount = async (documentId) => {
  return await Chunk.countDocuments({ documentId });
};

const getChunkStats = async (userId) => {
  const stats = await Chunk.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalChunks: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        totalChars: { $sum: '$charCount' },
        avgChunkSize: { $avg: '$charCount' },
      },
    },
  ]);
  return stats[0] || { totalChunks: 0, totalWords: 0, totalChars: 0, avgChunkSize: 0 };
};

module.exports = {
  chunkDocument,
  splitTextIntoChunks,
  getDocumentChunks,
  getChunksByPage,
  deleteDocumentChunks,
  getChunkCount,
  getChunkStats,
};