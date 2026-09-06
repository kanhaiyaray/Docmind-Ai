const { generateGroqResponse, generateGroqStream } = require('./groqService');
const { generateEmbedding, generateBatchEmbeddings } = require('../config/groq');

// AI Service - Groq only
class AIService {
  constructor() {
    this.provider = 'groq';
  }

  // Generate chat response
  async generateChatResponse(question, context) {
    console.log(`🧠 Using ${this.provider}...`);
    return await generateGroqResponse(question, context);
  }

  // Generate streaming response
  async generateChatStream(question, context) {
    console.log(`🚀 Using ${this.provider} stream...`);
    return await generateGroqStream(question, context);
  }

  // Generate embeddings
  async generateEmbedding(text) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      throw error;
    }
  }

  // Generate batch embeddings
  async generateBatchEmbeddings(texts) {
    try {
      return await generateBatchEmbeddings(texts);
    } catch (error) {
      console.error('Batch embedding generation failed:', error.message);
      throw error;
    }
  }

  // Get provider status
  getProviderStatus() {
    return {
      provider: this.provider,
      isGroqConfigured: !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'),
    };
  }
}

// Export singleton instance
module.exports = new AIService();
