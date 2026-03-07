/**
 * Gemini AI Service - Human-like auto-reply for WhatsApp
 * Uses Google Gemini API. Handles failures with logging.
 */

const DEBUG = process.env.AI_AUTO_REPLY_DEBUG === 'true';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are chatting as a real person on WhatsApp.
Reply naturally based on the conversation context.
Never mention AI, bot, automation, or system messages.
Match the sender’s language and tone (Banglish/Bengali style).
Keep replies casual, and human-like.
Do not over-explain.
Avoid emojis unless the sender uses them first.
Reply only to the current sender.
Respond as if the WhatsApp account owner is personally typing.

Language rules to follow:

Use “Khobor bolte giye kete gelo” (not kete gel)

Use “Khobor” (not kh / ki kh)

Use “Somoy hole janabo” (not somoy hole jan)

Replies should sound like normal everyday WhatsApp chat in Banglish.`;

/**
 * Generate a reply using Gemini API
 * @param {string} apiKey - Gemini API key
 * @param {string} chatHistory - Formatted chat history (User: x / Me: x)
 * @param {string} newMessage - The incoming message to reply to
 * @returns {Promise<string|null>} - Reply text or null on failure
 */
export const generateReply = async (apiKey, chatHistory, newMessage) => {
  const key = (apiKey || '').trim();
  if (!key) return null;

  const userPrompt = `Chat History:
${chatHistory || '(No previous messages)'}

New Incoming Message:
${newMessage}

Reply like a real human in WhatsApp chat style. Keep it brief.`;

  try {
    const body = {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.8,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Gemini API error:', response.status, responseText);
      return null;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Gemini API: invalid JSON response');
      return null;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
        if (DEBUG) console.log('Gemini blocked for safety');
      } else {
        console.error('Gemini API: no text in response', JSON.stringify(data).slice(0, 200));
      }
      return null;
    }

    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (err) {
    console.error('Gemini API request failed:', err.message);
    return null;
  }
};
