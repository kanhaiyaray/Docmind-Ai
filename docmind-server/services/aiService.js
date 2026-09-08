const { generateGroqResponse, generateGroqStream } = require('./groqService');
const embeddingClient = require('./embeddingClient');

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

  // Generate embeddings (single)
  async generateEmbedding(text) {
    try {
      const result = await embeddingClient.embed(text);
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      throw error;
    }
  }

  // Generate batch embeddings
  async generateBatchEmbeddings(texts) {
    try {
      return await embeddingClient.embed(texts);
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