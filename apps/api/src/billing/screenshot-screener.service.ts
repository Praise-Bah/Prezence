import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PLAN_PRICES_XAF, SCREENING } from '@prezence/config';
import type {
  ScreenshotScreeningResult,
  SubscriptionPlan,
} from '@prezence/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
}

@Injectable()
export class ScreenshotScreenerService {
  private readonly logger = new Logger(ScreenshotScreenerService.name);

  constructor(private readonly config: ConfigService) {}

  async screen(
    screenshotUrl: string,
    plan: Exclude<SubscriptionPlan, 'free'>,
    paymentMethod: 'mtn_momo' | 'orange_money',
    paymentRecipientNumber: string,
  ): Promise<ScreenshotScreeningResult> {
    const expectedAmountXaf = PLAN_PRICES_XAF[plan];
    const providerName =
      paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money';

    const systemPrompt = `You are a payment screenshot verification assistant for Prezence, an African tech platform.
Analyze the provided payment screenshot and return a JSON object only (no markdown fences).

Expected payment details:
- Provider: ${providerName}
- Amount: XAF ${expectedAmountXaf} (also accept within ±100 XAF tolerance)
- Recipient number: ${paymentRecipientNumber}

Return this exact JSON structure:
{
  "confidence": "HIGH" | "MEDIUM" | "LOW" | "SUSPICIOUS",
  "score": <0-100 integer>,
  "checks": {
    "is_momo_or_orange_format": <boolean>,
    "amount_matches_plan": <boolean>,
    "has_transaction_id": <boolean>,
    "date_is_recent": <boolean>,
    "recipient_number_matches": <boolean>
  },
  "rejection_reason": "<string or null>",
  "raw_model_response": "<brief summary of what you saw>"
}

Score guide: 85-100 = HIGH, 60-84 = MEDIUM, 40-59 = LOW, 0-39 = SUSPICIOUS.
Be strict: reject edited/cropped screenshots, wrong amounts, wrong providers.`;

    const apiKey = this.config.getOrThrow<string>('OPENROUTER_API_KEY');
    const model = this.config.getOrThrow<string>('SCREENSHOT_AI_MODEL');

    const response = await axios.post<{
      choices: [{ message: { content: string } }];
    }>(
      OPENROUTER_URL,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: screenshotUrl } },
              {
                type: 'text',
                text: 'Analyze this payment screenshot and return the JSON as instructed.',
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://prezence.app',
        },
        timeout: 30_000,
      },
    );

    const rawContent = response.data.choices[0].message.content;
    const cleaned = stripCodeFences(rawContent);

    try {
      const result = JSON.parse(cleaned) as ScreenshotScreeningResult;
      this.logger.log(
        `Screening complete: score=${result.score} confidence=${result.confidence}`,
      );
      return result;
    } catch {
      this.logger.warn(
        `Failed to parse screening result, raw: ${cleaned.slice(0, 200)}`,
      );
      return {
        confidence: 'SUSPICIOUS',
        score: 0,
        checks: {
          is_momo_or_orange_format: false,
          amount_matches_plan: false,
          has_transaction_id: false,
          date_is_recent: false,
          recipient_number_matches: false,
        },
        rejection_reason: 'AI screening returned unparseable response',
        raw_model_response: rawContent.slice(0, 500),
      };
    }
  }

  resolveConfidenceLevel(
    score: number,
  ): 'HIGH' | 'MEDIUM' | 'LOW' | 'SUSPICIOUS' {
    if (score >= SCREENING.confidence.HIGH) return 'HIGH';
    if (score >= SCREENING.confidence.MEDIUM) return 'MEDIUM';
    if (score >= SCREENING.confidence.LOW) return 'LOW';
    return 'SUSPICIOUS';
  }
}
