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

const SYSTEM_PROMPT =
  'You are a document Q&A assistant. ' +
  'Your ONLY source of truth is the DOCUMENT CONTEXT the user provides. ' +
  'RULES: ' +
  '(1) Extract facts, names, numbers, dates, definitions, and statements exactly as they appear in the context. ' +
  '(2) Interpret the user\'s question intent. If they use different words than the document, map them to the closest concept in the context. ' +
  '(3) Do NOT use outside knowledge, general definitions, or common sense. ' +
  '(4) If the document does not define something the user asks about, do not define it yourself. ' +
  '(5) If the answer is genuinely absent from the context, respond EXACTLY: "I could not find that information in this document." ' +
  '(6) Keep answers concise. Cite page numbers when available. ' +
  '(7) If the user asks for a LIST, enumerate every matching item present in the context. If the context is clearly truncated (i.e. you can see the document has more content than provided), say so explicitly instead of guessing. ' +
  '(8) Each block is labelled "POSITION N of M". POSITION 1 is the start of the document, POSITION M is the end. Use these labels when the user asks about "first", "last", "before", or "after". Do not guess order from keyword similarity. ' +
  '(9) Never invent page numbers. Only cite pages that appear in the context labels.';

const usesMaxCompletionTokens = (model = '') => {
  const m = String(model).toLowerCase();
  return (
    m.startsWith('gpt-5') ||
    m.startsWith('o1') ||
    m.startsWith('o3') ||
    m.startsWith('o4') ||
    m.includes('gpt-5')
  );
};

const MAX_OUTPUT_TOKENS = 2048;

const buildParams = (model, prompt, stream = false) => {
  const params = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  };
  if (stream) params.stream = true;
  if (usesMaxCompletionTokens(model)) {
    params.max_completion_tokens = MAX_OUTPUT_TOKENS;
  } else {
    params.max_tokens = MAX_OUTPUT_TOKENS;
  }
  return params;
};

const callWithFallback = async (client, model, prompt, stream = false) => {
  const primary = buildParams(model, prompt, stream);
  try {
    return await client.chat.completions.create(primary);
  } catch (error) {
    const msg = error?.message || '';
    const isParamError =
      msg.includes('max_tokens') ||
      msg.includes('max_completion_tokens') ||
      msg.includes('Unsupported parameter');
    if (!isParamError) throw error;
    const alt = { ...primary };
    if (alt.max_tokens !== undefined) {
      delete alt.max_tokens;
      alt.max_completion_tokens = MAX_OUTPUT_TOKENS;
    } else {
      delete alt.max_completion_tokens;
      alt.max_tokens = MAX_OUTPUT_TOKENS;
    }
    console.warn(`⚠️ Retrying with alternate token param (model: ${model})`);
    return await client.chat.completions.create(alt);
  }
};

const generateOpenAIResponse = async (prompt) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna';
  try {
    const completion = await callWithFallback(client, model, prompt, false);
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI chat error:', error?.message || error);
    throw error;
  }
};

const generateOpenAIStream = async (prompt) => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-5.6-luna';
  try {
    return await callWithFallback(client, model, prompt, true);
  } catch (error) {
    console.error('OpenAI stream error:', error?.message || error);
    throw error;
  }
};

module.exports = {
  generateOpenAIResponse,
  generateOpenAIStream,
  getOpenAIClient,
  SYSTEM_PROMPT,
};