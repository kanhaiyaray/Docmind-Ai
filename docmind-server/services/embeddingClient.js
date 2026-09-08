// docmind-server/services/embeddingClient.js
const axios = require('axios');
const { pipeline } = require('@xenova/transformers');

class EmbeddingClient {
  constructor() {
    this.provider = process.env.EMBEDDING_PROVIDER || 'huggingface';
    this.dimension = 384;

    if (this.provider === 'openai') {
      this.dimension = 1536;
      this.apiKey = process.env.OPENAI_API_KEY;
      this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002';
      this.url = 'https://api.openai.com/v1/embeddings';
    } else {
      this.apiKey = process.env.HUGGINGFACE_API_KEY;
      this.model = process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
      this.url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`;
    }

    this.localPipeline = null;
    this.localLoaded = false;
    this.fallbackUsed = false;
  }

  // ------------------- REMOTE API -------------------
  async embedRemote(texts) {
    const input = Array.isArray(texts) ? texts : [texts];
    if (this.provider === 'openai') {
      const response = await axios.post(
        this.url,
        { model: this.model, input },
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );
      return response.data.data.map(item => item.embedding);
    } else {
      const response = await axios.post(
        this.url,
        { inputs: input.length === 1 ? input[0] : input },
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );
      // HuggingFace returns an array of vectors for batch, or a single vector for one input
      if (Array.isArray(response.data) && Array.isArray(response.data[0]) && typeof response.data[0][0] === 'number') {
        return response.data;
      }
      if (Array.isArray(response.data) && typeof response.data[0] === 'number') {
        return [response.data];
      }
      return [response.data]; // fallback
    }
  }

  // ------------------- LOCAL PIPELINE -------------------
  async embedLocal(texts) {
    const input = Array.isArray(texts) ? texts : [texts];
    if (!this.localLoaded) {
      console.log('🧠 Loading local embedding model (first time may take a few seconds)...');
      this.localPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.localLoaded = true;
      console.log('✅ Local embedding model loaded.');
    }

    // Generate embeddings
    const output = await this.localPipeline(input, { pooling: 'mean', normalize: true });

    // Convert tensor/tensor array to plain JS arrays of numbers
    let embeddings = [];
    if (Array.isArray(output)) {
      // Batch mode: output is an array of Tensors
      for (const tensor of output) {
        embeddings.push(Array.from(tensor.data));
      }
    } else {
      // Single mode: output is a single Tensor
      embeddings.push(Array.from(output.data));
    }

    return embeddings;
  }

  // ------------------- MAIN EMBED FUNCTION -------------------
  async embed(texts) {
    try {
      const remoteResult = await this.embedRemote(texts);
      if (this.fallbackUsed) {
        console.log('✅ Remote API recovered – switching back to remote.');
        this.fallbackUsed = false;
      }
      return remoteResult;
    } catch (error) {
      if (!this.fallbackUsed) {
        console.warn('⚠️ Remote embedding failed, falling back to local model.');
        console.warn('   Error:', error.message);
        this.fallbackUsed = true;
      }
      return await this.embedLocal(texts);
    }
  }

  getDimension() {
    return this.dimension;
  }
}

module.exports = new EmbeddingClient();