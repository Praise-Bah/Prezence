# Prezence — Production Callbacks & Redirect URLs

Live production hosts:

```
API host  =  https://api.prezence.space   (VPS, must have TLS)
Web app   =  https://prezence.space        (Vercel)
```

> OAuth providers **reject non-HTTPS redirect URIs**. `api.prezence.space` must
> have a valid TLS cert (Caddy handles this automatically — see DEPLOYMENT.md).
> Point an **A record** `api.prezence.space → <VPS_IP>` before registering these.

---

## 1. Doppler URL vars — DONE

Already set on `prezence/prd`:

| Var | Value |
|---|---|
| `API_URL` | `https://api.prezence.space` |
| `FRONTEND_URL` | `https://prezence.space` |
| `APP_URL` | `https://prezence.space` |
| `NEXT_PUBLIC_API_URL` | `https://api.prezence.space` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.prezence.space` |

Set the same three public vars (`API_URL`, `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_WS_URL`) in **Vercel** too (dashboard or Doppler→Vercel integration).

---

## 2. Redirect URIs to register in each provider console

Paste each URL into the field named in the "Console field" column.

### Social sign-in (Sign in with Google / Facebook)

| Provider | Console field | Redirect URI to paste |
|---|---|---|
| Google | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → **Authorized redirect URIs** | `https://api.prezence.space/auth/callback/google` |
| Facebook | Meta for Developers → your App → Facebook Login → Settings → **Valid OAuth Redirect URIs** | `https://api.prezence.space/auth/callback/facebook` |

For Google, also add under **Authorized JavaScript origins**: `https://prezence.space`

### Platform publishing (connect + publish integrations)

| Platform | Console field | Redirect URI to paste |
|---|---|---|
| LinkedIn | LinkedIn Developer app → Auth → **Authorized redirect URLs** | `https://api.prezence.space/integration/oauth/linkedin/callback` |
| Facebook (Meta) | Meta app → Facebook Login → **Valid OAuth Redirect URIs** | `https://api.prezence.space/integration/oauth/facebook/callback` |
| Instagram (Meta) | Same Meta app → **Valid OAuth Redirect URIs** | `https://api.prezence.space/integration/oauth/instagram/callback` |
| Threads | Meta app (Threads use case) → Redirect URIs | `https://api.prezence.space/integration/oauth/threads/callback` |
| GitHub | GitHub → Settings → Developer settings → OAuth Apps → **Authorization callback URL** | `https://api.prezence.space/integration/oauth/github/callback` |
| TikTok | TikTok for Developers → your app → **Redirect URI** | `https://api.prezence.space/integration/oauth/tiktok/callback` |
| Freelancer | Freelancer → Developers → OAuth apps → **Redirect URIs** | `https://api.prezence.space/integration/oauth/freelancer/callback` |

---

## 3. Where users land after each flow (FYI — no action needed)

Driven automatically by `FRONTEND_URL`:

| Flow | Redirect target |
|---|---|
| Social login success | `https://prezence.space/social/callback` |
| Platform connect (success/deny/fail) | `https://prezence.space/platforms` |
| Password-reset email link | `https://prezence.space/reset-password?token=…` |

---

## 4. Notes / gotchas

- **Keep the localhost URIs too.** Add these production URIs *alongside* the
  existing `http://localhost:3001/...` dev URIs in each app — don't replace them.
- **One Meta app can serve both** social login and fb/ig/threads publishing if
  `FACEBOOK_APP_ID` == `META_APP_ID`. Add **all** the Meta redirect URIs to it.
- **Meta App Review:** facebook/instagram/threads publishing needs the app in
  **Live** mode with permissions approved; until then the cascade falls back to
  the browser-automation layers automatically.
- **Skyvern webhook** is built from `API_URL`, so it must be publicly reachable
  over HTTPS at `api.prezence.space`.
- **Email:** verify `prezence.space` in **Resend** (Domains → add DNS records),
  then switch `NOTIFICATIONS_FROM_EMAIL` to `Prezence <noreply@prezence.space>`.

---

## Source of truth (code references)

| Redirect | Built in |
|---|---|
| Social callbacks | `apps/api/src/auth/strategies/{google,facebook}.strategy.ts` |
| Social success redirect | `apps/api/src/auth/auth.controller.ts` |
| Platform OAuth callback | `apps/api/src/integration/services/oauth.service.ts` (`redirectUri`) |
| Platform connect redirect | `apps/api/src/integration/integration.controller.ts` |
| Password-reset link | `apps/api/src/auth/auth.service.ts` (`appUrl`) |
| CORS / WebSocket origin | `apps/api/src/main.ts`, `apps/api/src/events/events.gateway.ts` |
