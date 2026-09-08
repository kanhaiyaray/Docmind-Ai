const OpenAI = require('openai');

let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

// Single‑argument version for controllers
const generateOpenAIResponse = async (prompt) => {
  try {
    const client = getOpenAIClient();
    const model = process.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna';

    const completion = await client.chat.completions.create({
      model: model,
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
      // temperature removed or set to 1 (default)
      // temperature: 1,  // uncomment if needed but 1 is default
      max_completion_tokens: 2048,
      // top_p: 0.9,     // remove if also unsupported
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI chat error:', error);
    throw error;
  }
};

// (Optional) streaming version – implement if needed
const generateOpenAIStream = async (prompt) => {
  // Similar adjustments if implemented
};

module.exports = {
  generateOpenAIResponse,
  generateOpenAIStream,
  getOpenAIClient,
};