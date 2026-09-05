const Chunk = require('../models/Chunk');

// Configuration
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 800;
const OVERLAP = parseInt(process.env.OVERLAP) || 150;

// Chunk document pages into smaller pieces
const chunkDocument = async (documentId, userId, pages) => {
  try {
    const chunks = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text;
      const pageNumber = page.pageNumber;

      // Split page text into chunks with overlap
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
            filename: '', // Will be filled later if needed
            pageNumber,
            chunkSize: chunkText.length,
          },
          charCount: chunkText.length,
          wordCount: chunkText.split(/\s+/).length,
        });
      }
    }

    // Bulk insert chunks
    if (chunks.length > 0) {
      await Chunk.insertMany(chunks);
    }

    console.log(`✅ Created ${chunks.length} chunks for document ${documentId}`);
    return chunks;
  } catch (error) {
    console.error('Chunking error:', error);
    throw new Error(`Failed to chunk document: ${error.message}`);
  }
};

// Split text into overlapping chunks
const splitTextIntoChunks = (text, chunkSize, overlap) => {
  if (!text || text.length === 0) return [];

  const chunks = [];
  let start = 0;

  // Clean text - remove extra whitespace
  const cleanedText = text.replace(/\s+/g, ' ').trim();

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to break at sentence boundary
    if (end < cleanedText.length) {
      // Look for sentence ending within last 50 chars
      const searchStart = Math.max(start, end - 50);
      const searchEnd = end;
      const searchText = cleanedText.substring(searchStart, searchEnd);
      
      // Find last sentence ending
      const sentenceEndings = ['. ', '? ', '! ', '.\n', '?\n', '!\n'];
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
        // Try to break at whitespace
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

    // Move start forward with overlap
    start = end - overlap;
    if (start < end - overlap) {
      start = end - overlap;
    }
    if (start >= cleanedText.length) break;
  }

  return chunks;
};

// Get chunks for a document
const getDocumentChunks = async (documentId) => {
  return await Chunk.find({ documentId }).sort({ chunkIndex: 1 });
};

// Get chunks by page
const getChunksByPage = async (documentId, pageNumber) => {
  return await Chunk.find({ documentId, pageNumber }).sort({ chunkIndex: 1 });
};

// Delete chunks for a document
const deleteDocumentChunks = async (documentId) => {
  return await Chunk.deleteMany({ documentId });
};

// Get total chunks count for a document
const getChunkCount = async (documentId) => {
  return await Chunk.countDocuments({ documentId });
};

// Get chunk statistics
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
