const { generateOpenAIResponse, generateOpenAIStream } = require('./openaiService');
const embeddingClient = require('./embeddingClient');

class AIService {
  constructor() {
    this.provider = 'openai';
  }

  async generateChatResponse(question, context) {
    console.log(`🧠 Using ${this.provider}...`);
    const fullPrompt = [
      '===================== DOCUMENT CONTEXT =====================',
      context,
      '=================== END DOCUMENT CONTEXT ===================',
      '',
      'USER QUESTION:',
      question,
      '',
      'ANSWER (using ONLY the document context above):',
    ].join('\n');
    return await generateOpenAIResponse(fullPrompt);
  }

  async generateChatStream(question, context) {
    console.log(`🚀 Using ${this.provider} stream...`);
    const fullPrompt = [
      '===================== DOCUMENT CONTEXT =====================',
      context,
      '=================== END DOCUMENT CONTEXT ===================',
      '',
      'USER QUESTION:',
      question,
      '',
      'ANSWER (using ONLY the document context above):',
    ].join('\n');
    return await generateOpenAIStream(fullPrompt);
  }

  async generateEmbedding(text) {
    const result = await embeddingClient.embed(text);
    return Array.isArray(result) ? result[0] : result;
  }

  async generateBatchEmbeddings(texts) {
    return await embeddingClient.embed(texts);
  }

  getProviderStatus() {
    return {
      provider: this.provider,
      isOpenAIConfigured: !!process.env.OPENAI_API_KEY,
    };
  }
}

module.exports = new AIService();