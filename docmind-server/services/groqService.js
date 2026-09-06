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

// Generate chat response using Groq
const generateGroqResponse = async (prompt, context) => {
  try {
    const client = getGroqClient();
    
    // Build the full prompt
    const fullPrompt = `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`;
    
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
              content: fullPrompt,
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
    console.error('Error generating Groq response:', error);
    throw error;
  }
};

// Generate streaming response using Groq
const generateGroqStream = async (prompt, context) => {
  try {
    const client = getGroqClient();
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    
    const fullPrompt = `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`;
    
    console.log(`🚀 Groq Stream - Using model: ${model}`);
    
    const stream = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Answer questions based on the provided context. Be concise and accurate.',
        },
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('Error generating Groq stream:', error);
    throw error;
  }
};

module.exports = {
  generateGroqResponse,
  generateGroqStream,
  getGroqClient,
};
