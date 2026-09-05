const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number],
      default: null,
    },
    metadata: {
      filename: String,
      pageNumber: Number,
      chunkSize: Number,
    },
    charCount: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for vector search
chunkSchema.index({ documentId: 1, pageNumber: 1 });
chunkSchema.index({ userId: 1, documentId: 1 });

// Create vector search index (to be created in MongoDB Atlas)
// This is just a placeholder - actual index created in MongoDB Atlas UI

const Chunk = mongoose.model('Chunk', chunkSchema);

module.exports = Chunk;
