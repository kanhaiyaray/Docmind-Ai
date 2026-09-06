const Groq = require('groq-sdk');

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
};

// Generate embedding for a single text
const generateEmbedding = async (text) => {
  try {
    // Simple embedding fallback - convert text to vector
    const words = text.split(/\s+/).slice(0, 100);
    const embedding = [];
    for (let i = 0; i < 768; i++) {
      let value = 0;
      for (const word of words) {
        value += (word.charCodeAt(i % word.length) || 0) / 255;
      }
      embedding.push(value / (words.length || 1));
    }
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Generate batch embeddings
const generateBatchEmbeddings = async (texts) => {
  try {
    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
};

// Generate chat response using Groq
const generateChatResponse = async (prompt) => {
  try {
    const client = getGroqClient();
    
    const models = [
      process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'groq/compound',
      'groq/compound-mini',
      'qwen/qwen3.8-27b',
      'qwen/qwen3.6-27b',
      'allam-2-7b'
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`🚀 Groq - Trying model: ${model}`);
        
        const chatCompletion = await client.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Answer questions based on the provided context. Be concise and accurate. Cite sources when possible.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: model,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.9,
        });

        console.log(`✅ Groq - Model ${model} successful!`);
        return chatCompletion.choices[0]?.message?.content || '';
      } catch (error) {
        console.log(`⚠️ Groq - Model ${model} failed:`, error.message);
        lastError = error;
      }
    }
    
    throw lastError || new Error('All Groq models failed');
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

// Get Groq client
const getGroqClientInstance = () => {
  return getGroqClient();
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  generateChatResponse,
  getGroqClient: getGroqClientInstance,
};
