const crypto = require('crypto');
const { getCached, setCached } = require('./cacheService');
const logger = require('../utils/logger');

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const LLM_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

/**
 * Hash a prompt string for use as a Redis cache key.
 * @param {string} prompt
 * @returns {string}
 */
function hashPrompt(prompt) {
  return 'llm:' + crypto.createHash('sha256').update(prompt).digest('hex');
}

/**
 * Call the NVIDIA LLaMA3 API and parse the response as JSON.
 * Caches responses in Redis by prompt hash for 6 hours.
 * Strips markdown code fences if the model wraps output.
 * @param {string} prompt - The user prompt to send to the LLM.
 * @returns {Promise<Object>} Parsed JSON object from LLM response.
 */
async function generateJSON(prompt, { maxTokens = 2048 } = {}) {
  const cacheKey = hashPrompt(prompt);

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      logger.info('LLM cache hit', { cacheKey });
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.error('Redis cache read error', { error: err.message });
  }

  const invokeUrl = NVIDIA_API_URL;
  const stream = false;

  const headers = {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
    Accept: stream ? 'text/event-stream' : 'application/json',
    'Content-Type': 'application/json',
  };

  const payload = {
    model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 1.0,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    stream,
  };

  logger.info('LLM generateJSON request', { promptLength: prompt.length, maxTokens });

  const response = await fetch(invokeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('LLM API error', { status: response.status, body: errText });
    throw new Error(`LLM API request failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content || '';

  // Safe JSON extraction — strips markdown fences, then finds the outermost
  // JSON structure (array OR object) by locating the first [ or { and the
  // last matching ] or }.  This correctly handles array responses like
  // [{...},{...}] where the old object-first regex would strip the brackets.
  let cleanJson = rawText.trim();

  const fenceMatch =
    cleanJson.match(/```json\s*([\s\S]*?)```/) ||
    cleanJson.match(/```\s*([\s\S]*?)```/);

  if (fenceMatch) {
    cleanJson = fenceMatch[1].trim();
  } else {
    const firstBracket = cleanJson.search(/[\[{]/);
    if (firstBracket >= 0) {
      const startChar = cleanJson[firstBracket];
      const endChar = startChar === '[' ? ']' : '}';
      const lastIndex = cleanJson.lastIndexOf(endChar);
      if (lastIndex > firstBracket) {
        cleanJson = cleanJson.slice(firstBracket, lastIndex + 1);
      }
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr) {
    logger.error('LLM JSON parse error', { rawText, error: parseErr.message });
    throw new Error('LLM returned invalid JSON');
  }

  try {
    await setCached(cacheKey, JSON.stringify(parsed), LLM_CACHE_TTL);
  } catch (err) {
    logger.error('Redis cache write error', { error: err.message });
  }

  return parsed;
}

/**
 * Call the NVIDIA LLaMA3 API and return raw text response.
 * Caches responses in Redis by prompt hash for 6 hours.
 * @param {string} prompt - The user prompt to send to the LLM.
 * @returns {Promise<string>} Raw text response from LLM.
 */
async function generateText(prompt) {
  const cacheKey = hashPrompt(prompt);

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      logger.info('LLM text cache hit', { cacheKey });
      return cached;
    }
  } catch (err) {
    logger.error('Redis cache read error', { error: err.message });
  }

  const invokeUrl = NVIDIA_API_URL;

  logger.info('LLM generateText request', { promptLength: prompt.length });

  const response = await fetch(invokeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 1.0,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error('LLM API error', { status: response.status, body: errText });
    throw new Error(`LLM API request failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  try {
    await setCached(cacheKey, text, LLM_CACHE_TTL);
  } catch (err) {
    logger.error('Redis cache write error', { error: err.message });
  }

  return text;
}

module.exports = { generateJSON, generateText };
