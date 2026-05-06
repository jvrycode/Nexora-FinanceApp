/**
 * Groq AI Service — Financial chat assistant
 * Uses Groq's blazing fast Llama 3 models via fetch
 */
import { PortfolioSummary } from '@/types';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

function buildSystemPrompt(portfolio?: PortfolioSummary): string {
  let prompt = `You are Nexora AI, a concise personal finance assistant.
Rules you must follow:
- Never use emoji in responses. Zero emoji.
- Keep responses concise and direct.
- Format currency with $ and commas.
- Be professional and realistic.
- Do NOT read out or summarize the user's portfolio or net worth unless they explicitly ask for it. Wait for their specific questions.`;

  if (portfolio) {
    prompt += `\n\nUser portfolio:
- Net Worth: $${portfolio.totalNetWorth.toLocaleString()}
- Assets: $${portfolio.totalAssets.toLocaleString()}
- Crypto: $${portfolio.totalCrypto.toLocaleString()}
- Stocks: $${portfolio.totalStocks.toLocaleString()}
- Liabilities: -$${Math.abs(portfolio.totalLiabilities).toLocaleString()}`;
  }
  return prompt;
}

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  portfolio?: PortfolioSummary,
): Promise<string> {
  if (!API_KEY) {
    return 'Groq API key is not configured. Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.';
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: buildSystemPrompt(portfolio) },
      ...messages
    ]
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('[Nexora AI] Groq API Error:', errorData);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || '';
    
    // Strip emojis
    text = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    return text;
  } catch (error: any) {
    console.warn(`[Nexora AI] Error:`, error);
    return 'The AI is temporarily unavailable. Please wait a moment and try again.';
  }
}
