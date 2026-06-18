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
Analyze the provided payment screenshot and return a JSON object only — no markdown, no code fences, no extra text.

## Expected payment details
- Provider: ${providerName}
- Amount: XAF ${expectedAmountXaf} (users may send slightly more due to transfer fees — see amount matching rules below)
- Recipient number: ${paymentRecipientNumber}

## How to recognise an authentic MTN MoMo SMS
MTN MoMo confirmation SMS in Cameroon follows this exact pattern (French):
  "Transfert de {AMOUNT} FCFA effectue avec succes a {RECIPIENT_NAME} ({RECIPIENT_NUMBER}) le {DATE} {TIME}. FRAIS {FEE} FCFA. transaction Id: {TRANSACTION_ID}. Reference: {REF}. Nouveau solde est: {BALANCE} FCFA."
Key fields to locate:
  - Amount: the number immediately after "Transfert de" and before "FCFA effectue"
  - Recipient number: the phone number inside parentheses after the recipient name
  - Transaction ID: the number/string after "transaction Id:"
  - Date: the date after "le " in YYYY-MM-DD format
  - Note: ignore any promotional text about "Prix Cassés" or MoMo App that may appear after the balance

## How to recognise an authentic Orange Money SMS
Orange Money confirmation SMS in Cameroon follows this exact pattern (French):
  "Transfert de {SENDER_NUMBER} {SENDER_NAME} vers {RECIPIENT_NUMBER} {RECIPIENT_NAME} reussi. ID transaction: {TRANSACTION_ID}, Montant Transaction: {AMOUNT} FCFA, Frais: {FEE} FCFA, Commission: {COMMISSION} FCFA, Montant Net: {NET} FCFA, Nouveau Solde: {BALANCE} FCFA."
Key fields to locate:
  - Amount: the number after "Montant Transaction:" and before "FCFA"
  - Recipient number: the number after "vers " (before the recipient name)
  - Transaction ID: the alphanumeric code after "ID transaction:" (e.g. PP260617.2139.B29925)
  - Note: "Montant Net" includes fees deducted from sender — use "Montant Transaction" as the paid amount

## Amount matching rules
- The screenshot amount may be HIGHER than the plan price due to transfer fees (FRAIS/Frais).
  Accept if: screenshot_amount >= plan_amount AND screenshot_amount <= plan_amount + 500
- For Orange Money, use "Montant Transaction" (the gross amount sent), NOT "Montant Net"

## Rejection criteria (score 0-39, confidence SUSPICIOUS)
- Screenshot is not an MTN MoMo or Orange Money SMS
- Amount is less than the plan price (potential fraud)
- Recipient number does not match (money sent to wrong account)
- Screenshot appears edited, the font/format looks wrong, or text is garbled
- Transaction ID is missing
- Date is older than 48 hours from today

## Return this exact JSON structure
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
  "rejection_reason": "<string if rejected, null if accepted>",
  "raw_model_response": "<brief description of what you saw: provider, amount, transaction id, recipient>"
}

Score guide: 85-100 = HIGH, 60-84 = MEDIUM, 40-59 = LOW, 0-39 = SUSPICIOUS.`;

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
