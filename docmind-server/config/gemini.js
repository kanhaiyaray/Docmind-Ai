const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models
const embeddingModel = genAI.getGenerativeModel({
  model: 'embedding-001',
});

const chatModel = genAI.getGenerativeModel({
  model: 'gemini-pro',
});

// Generate embedding for text
const generateEmbedding = async (text) => {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Generate chat response
const generateChatResponse = async (prompt) => {
  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

// Generate embedding for multiple texts (batch)
const generateBatchEmbeddings = async (texts) => {
  try {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
};

module.exports = {
  generateEmbedding,
  generateChatResponse,
  generateBatchEmbeddings,
  embeddingModel,
  chatModel,
};
