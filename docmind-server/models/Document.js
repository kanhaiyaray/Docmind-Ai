const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    processingError: {
      type: String,
      default: null,
    },
    metadata: {
      author: String,
      title: String,
      subject: String,
      keywords: [String],
      creationDate: Date,
      modificationDate: Date,
    },
    summary: {
      type: String,
      default: null,
    },
    tags: [String],
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ title: 'text' });

// Virtual for file size in KB
documentSchema.virtual('fileSizeKB').get(function () {
  return Math.round(this.fileSize / 1024);
});

// Virtual for file size in MB
documentSchema.virtual('fileSizeMB').get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Check if document is ready for chat
documentSchema.methods.isReady = function () {
  return this.status === 'completed' && this.pageCount > 0;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
