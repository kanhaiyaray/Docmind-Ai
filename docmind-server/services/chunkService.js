const Chunk = require('../models/Chunk');

// Configuration
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 800;
const OVERLAP = parseInt(process.env.OVERLAP) || 150;

// Chunk document pages into smaller pieces
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
          console.log(`✅ Inserted ${totalChunks} chunks so far...`);
          chunks = [];
          if (global.gc) {
            global.gc();
          }
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

  const chunks = [];
  let start = 0;
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const textLength = cleanedText.length;

  while (start < textLength) {
    let end = Math.min(start + chunkSize, textLength);

    if (end < textLength) {
      const searchStart = Math.max(start, end - 50);
      const searchEnd = end;
      const searchText = cleanedText.substring(searchStart, searchEnd);
      
      const sentenceEndings = ['. ', '? ', '! ', '.\n', '?\n', '!\n', '.', '?', '!'];
      let lastEnding = -1;
      
      for (const ending of sentenceEndings) {
        const idx = searchText.lastIndexOf(ending);
        if (idx > lastEnding) {
          lastEnding = idx;
        }
      }

      if (lastEnding > 0) {
        end = searchStart + lastEnding + 1;
      } else {
        const lastSpace = cleanedText.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }
    }

    const chunk = cleanedText.substring(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    start = Math.max(start + 1, end - overlap);
    if (start >= textLength) break;
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

  return stats[0] || {
    totalChunks: 0,
    totalWords: 0,
    totalChars: 0,
    avgChunkSize: 0,
  };
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
