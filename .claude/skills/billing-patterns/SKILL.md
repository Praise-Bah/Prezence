---
name: billing-patterns
description: Use when working on BillingModule, payment flows, Flutterwave
integration, Paystack integration, subscription management, webhook handlers,
or anything related to money and payments in Prezence.
---

# Billing & Payment Patterns

## Provider selection logic
```typescript
selectProvider(country: string): PaymentProvider {
  if (['NG', 'GH', 'ZA'].includes(country)) return this.paystack;
  return this.flutterwave; // default for CM and francophone Africa
}
```

## Fee awareness
- Flutterwave CM: 1.4% local, 3.8% international
- Paystack NG: 1.5% + ₦100
- Stripe (Phase 3 via UK entity only): 2.9% + €0.30

## Subscription states
trial → active → past_due → cancelled
Never skip states. Transitions are explicit and logged.

## Dunning logic
- Renewal fails → past_due
- Retry after 24h, retry after 72h
- After 3 fails over 7 days → downgrade to free, notify user
- Grace period: 7 days full access even in past_due

## Webhook security
Always verify Flutterwave signature before processing:
```typescript
const hash = crypto
  .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_HASH)
  .update(JSON.stringify(payload))
  .digest('hex');
if (hash !== req.headers['verif-hash']) {
  throw new UnauthorizedException('Invalid webhook signature');
}
```

## Manual fallback (MVP only)
During beta, support team can manually activate subscriptions via
admin endpoint after verifying MoMo/Orange transaction in Flutterwave dashboard.

## OpenRouter JSON parsing — always strip fences
Claude via OpenRouter may wrap JSON in ```json fences even with
response_format: json_object. Always strip before parsing:

```typescript
const clean = response.replace(/```json\n?|\n?```/g, '').trim();
const result: ScreenshotScreeningResult = JSON.parse(clean);
```
