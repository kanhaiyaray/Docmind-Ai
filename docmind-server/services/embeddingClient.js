const axios = require('axios');

class EmbeddingClient {
  constructor() {
    this.provider = 'openai';
    this.dimension = 1536;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002';
    this.url = 'https://api.openai.com/v1/embeddings';
  }

  async embed(texts) {
    const input = Array.isArray(texts) ? texts : [texts];
    try {
      const response = await axios.post(
        this.url,
        { model: this.model, input },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      return response.data.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI embedding failed:', error.message);
      throw new Error('Embedding generation failed');
    }
  }

  getDimension() {
    return this.dimension;
  }
}

module.exports = new EmbeddingClient();