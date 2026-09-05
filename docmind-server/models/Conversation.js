const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sources: [
    {
      page: Number,
      document: String,
      documentId: mongoose.Schema.Types.ObjectId,
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    messages: [messageSchema],
    metadata: {
      totalTokens: Number,
      processingTime: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Get last N messages
conversationSchema.methods.getLastMessages = function (n = 10) {
  return this.messages.slice(-n);
};

// Get message count
conversationSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// Get user messages count
conversationSchema.methods.getUserMessageCount = function () {
  return this.messages.filter(m => m.role === 'user').length;
};

// Get assistant messages count
conversationSchema.methods.getAssistantMessageCount = function () {
  return this.messages.filter(m => m.role === 'assistant').length;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
