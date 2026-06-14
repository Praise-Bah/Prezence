---
name: prezence-patterns
description: Use when writing ANY Prezence code — NestJS modules, services,
controllers, BillingModule, IntelligenceModule, IntegrationModule, payment flows,
OAuth token handling, BullMQ jobs, Playwright automation, or anything in this
monorepo. Enforces all architecture rules from CLAUDE.md and PRZ-SRS-003 v3.0.
---

# Prezence Architecture Patterns

## Stack reminder
- Backend: NestJS 10, TypeScript strict, Node.js 20 LTS (apps/api/)
- Web: Next.js 14 App Router, Tailwind CSS (apps/web/)
- Mobile: React Native Expo SDK 51+ (apps/mobile/)
- DB: PostgreSQL 15 + pgvector via Supabase
- Cache/Queue: Redis 7 via Upstash + BullMQ
- AI: OpenRouter (Claude Sonnet for generation, Gemini Flash for QA)
- Payments: Flutterwave primary, Paystack Phase 2, Stripe Phase 3

## RULE 1 — PaymentService abstraction (NEVER violate)
All payment gateway calls must go through PaymentService in BillingModule.

✅ CORRECT:
```typescript
constructor(private readonly paymentService: PaymentService) {}
await this.paymentService.createSubscription(params);
await this.paymentService.chargeOnce(params);
```

❌ WRONG — never do this:
```typescript
constructor(private readonly flutterwave: FlutterwaveService) {}
constructor(private readonly paystack: PaystackService) {}
```

## RULE 2 — OAuth token encryption (NEVER store plaintext)
Always AES-256-GCM encrypt tokens before storage. Never log them.

✅ CORRECT:
```typescript
const encrypted = this.encryptionService.encrypt(rawToken);
await this.repo.save({ encrypted_access_token: encrypted });
```

❌ WRONG:
```typescript
await this.repo.save({ access_token: rawToken });
this.logger.log(`Token: ${token}`); // NEVER log tokens
```

## RULE 3 — BullMQ for ALL async jobs
Never await browser automation or long-running tasks inline.

✅ CORRECT:
```typescript
await this.automationQueue.add('update-profile', {
  userId,
  platform,
  jobType: 'L3A_PLAYWRIGHT'
});
// return job_id immediately, push status via WebSocket
```

❌ WRONG:
```typescript
await this.playwrightService.updateLinkedIn(userId); // blocks the request
```

## RULE 4 — Versioned cache keys
Always include interview_version in generated content cache keys.

✅ CORRECT:
```typescript
const key = `gen:${userId}:${platform}:v${interviewVersion}`;
const marketKey = `market:${role}:${region}`; // 24h TTL
```

❌ WRONG:
```typescript
const key = `profile:${userId}`; // not versioned, stale data risk
```

## RULE 5 — Idempotent webhook handlers
Always use UNIQUE constraint on provider_event_id. Catch integrity errors.

✅ CORRECT:
```typescript
try {
  await this.paymentEventRepo.insert({
    provider_event_id: event.id, // UNIQUE in DB
    provider: 'flutterwave',
    ...eventData
  });
} catch (error) {
  if (error.code === '23505') { // unique violation
    this.logger.warn(`Duplicate webhook ignored: ${event.id}`);
    return { received: true }; // return 200, do not process again
  }
  throw error;
}
```

## RULE 6 — Module boundaries
Only import from a module's public index.ts exports.
Never reach into another module's internal files.

✅ CORRECT:
```typescript
import { PaymentService } from '../billing'; // from index.ts
```

❌ WRONG:
```typescript
import { FlutterwaveService } from '../billing/providers/flutterwave.service';
```

## RULE 7 — NestJS logging
Use NestJS Logger. Never use console.log in source code.

✅ CORRECT:
```typescript
private readonly logger = new Logger(YourService.name);
this.logger.log('Processing job');
this.logger.error('Job failed', error.stack);
```

❌ WRONG:
```typescript
console.log('Processing job'); // never in source
```

## Standard module structure
When generating any new NestJS module, always create this structure:
```
src/module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── index.ts                    ← public exports only
├── dto/
│   ├── create-xxx.dto.ts
│   └── update-xxx.dto.ts
├── entities/
│   └── xxx.entity.ts
└── module-name.service.spec.ts ← test file always
```

## DTO validation pattern
Always use class-validator on every DTO:
```typescript
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## TypeORM query safety
Always use parameterized queries. Never string interpolation.

✅ CORRECT:
```typescript
await this.repo.findOne({ where: { email } });
await this.repo.createQueryBuilder('user')
  .where('user.id = :id', { id: userId })
  .getOne();
```

❌ WRONG:
```typescript
await this.repo.query(`SELECT * FROM users WHERE id = ${userId}`);
```
