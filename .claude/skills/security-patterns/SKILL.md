---
name: security-patterns
description: Use when writing authentication code, JWT handling, OAuth flows,
token encryption, rate limiting, webhook verification, or any security-sensitive
code in Prezence. Invoke for guards, interceptors, encryption services.
---

# Security Patterns for Prezence

## JWT configuration
- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry, rotate on every use
- If refresh token reused after rotation → invalidate entire session

## Envelope encryption for OAuth tokens
```typescript
// Each user gets a unique data encryption key (DEK)
// DEK is encrypted with master key from Doppler
encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', this.dek, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(b => b.toString('hex')).join(':');
}
```

## Rate limiting
- Authenticated: 100 requests per 15 minutes per user
- Unauthenticated: 20 requests per 15 minutes per IP
- Auth endpoints: 5 attempts per 15 minutes per IP

## Account lockout
- 5 failed logins → 15-minute lockout
- Store lockout state in Redis with TTL

## What to NEVER do
- Never log Authorization headers
- Never log raw tokens or passwords
- Never return tokens in error responses
- Never store tokens without encryption
- Never skip signature verification on webhooks
- Never use Math.random() for security tokens (use crypto.randomBytes)
