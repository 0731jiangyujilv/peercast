import OpenAI from "openai"
import { config } from "../config"

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY })

export interface ParsedBetIntent {
  opponent: string | null
  asset: string | null
  duration: number | null
  durationText: string | null
  amount: number | null
  direction: "UP" | "DOWN" | null
  confidence: number
  error: string | null
}

const SYSTEM_PROMPT = `You are a Peercast parser for a crypto price Peercast bot. Extract structured Peercast information from user messages.

Supported assets: BTC/USD, LINK/USD
Duration range: 3 minutes to 7 days
The user may write in English or Chinese.

Return a JSON object with these fields:
- opponent: the @username mentioned (without @), or null
- asset: one of "BTC/USD", "LINK/USD", or null if unclear
- duration: duration in seconds, or null. Parse "5m"=300, "1h"=3600, "1d"=86400, "5分钟"=300, "1小时"=3600
- durationText: human readable duration like "5 minutes", or null
- amount: the Peercast amount as a number (in USDC), or null
- direction: "UP" or "DOWN" for the message sender's side, or null if not specified
- confidence: 0.0 to 1.0 how confident you are in the parse
- error: a brief error message if something is unclear, or null

Examples:
- "跟 @alice Peercast 100U BTC 5分钟涨" → {"opponent":"alice","asset":"BTC/USD","duration":300,"durationText":"5 minutes","amount":100,"direction":"UP","confidence":0.95,"error":null}
- "peercast @bob 50 LINK 1h down" → {"opponent":"bob","asset":"LINK/USD","duration":3600,"durationText":"1 hour","amount":50,"direction":"DOWN","confidence":0.95,"error":null}
- "I want to Peercast ETH" → {"opponent":null,"asset":null,"duration":null,"durationText":null,"amount":null,"direction":null,"confidence":0.2,"error":"ETH/USD is not currently supported. Supported assets: BTC/USD, LINK/USD"}

ONLY return valid JSON. No markdown, no explanation.`

export async function parseBetIntent(message: string): Promise<ParsedBetIntent> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.1,
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      return {
        opponent: null, asset: null, duration: null, durationText: null,
        amount: null, direction: null, confidence: 0, error: "No response from AI",
      }
    }

    const parsed = JSON.parse(content) as ParsedBetIntent
    return parsed
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      opponent: null, asset: null, duration: null, durationText: null,
      amount: null, direction: null, confidence: 0, error: `Parse error: ${errorMsg}`,
    }
  }
}
