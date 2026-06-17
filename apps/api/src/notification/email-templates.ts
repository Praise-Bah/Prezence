export type EmailType =
  | 'payment_initiated'
  | 'payment_approved'
  | 'payment_provisional'
  | 'payment_rejected'
  | 'content_ready'
  | 'content_failed';

export interface EmailPayload {
  subject: string;
  html: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function s(val: unknown, fallback = ''): string {
  if (val == null) return fallback;
  if (typeof val === 'string') return escapeHtml(val);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

function base(body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
    <img src="https://prezence.app/logo.png" alt="Prezence" width="120" style="margin-bottom:24px">
    ${body}
    <hr style="margin-top:32px;border:none;border-top:1px solid #e5e5e5">
    <p style="font-size:12px;color:#6b7280">Prezence — AI-powered personal branding for African youth.</p>
  </body></html>`;
}

export function renderTemplate(
  type: EmailType,
  data: Record<string, unknown>,
): EmailPayload {
  switch (type) {
    case 'payment_initiated':
      return {
        subject: `Your payment reference: ${s(data.reference)}`,
        html: base(`
          <h2>Payment instructions</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>Send exactly <strong>XAF ${s(data.amount)}</strong> to
          <strong>${s(data.recipientNumber)}</strong> via ${s(data.method)}.</p>
          <p>Include reference code <strong>${s(data.reference)}</strong> in the payment note,
          then upload your screenshot on the next screen.</p>
          <p style="color:#6b7280;font-size:14px">Reference expires in 48 hours.</p>
        `),
      };

    case 'payment_approved':
      return {
        subject: 'Your Prezence subscription is active 🎉',
        html: base(`
          <h2>Welcome to Prezence ${s(data.plan)}!</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>Your payment has been verified and your <strong>${s(data.plan)}</strong> plan is now active.</p>
          <p><a href="https://prezence.app/dashboard" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Go to dashboard</a></p>
        `),
      };

    case 'payment_provisional':
      return {
        subject: 'Your payment is awaiting review',
        html: base(`
          <h2>Payment under review</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>We received your screenshot and have granted temporary access to your <strong>${s(data.plan)}</strong> plan while an admin reviews the payment.</p>
          <p>We will email you again once the payment is confirmed. If it cannot be verified, access may be reverted.</p>
          <p><a href="https://prezence.app/dashboard" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Go to dashboard</a></p>
        `),
      };

    case 'payment_rejected':
      return {
        subject: "We couldn't verify your payment",
        html: base(`
          <h2>Payment verification failed</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>Unfortunately we couldn't verify your screenshot. Reason: <em>${s(data.reason, 'Low confidence score')}</em></p>
          <p>Please submit a clearer screenshot showing the full transaction details.</p>
          <p><a href="https://prezence.app/billing" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Try again</a></p>
        `),
      };

    case 'content_ready':
      return {
        subject: `Your ${s(data.platform)} profile is ready`,
        html: base(`
          <h2>Your profile has been generated</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>Your <strong>${s(data.platform)}</strong> profile is ready with a quality score of
          <strong>${s(data.qualityScore, '—')}/100</strong>.</p>
          <p><a href="https://prezence.app/content/${s(data.platform)}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">View your profile</a></p>
        `),
      };

    case 'content_failed':
      return {
        subject: `Profile generation for ${s(data.platform)} failed`,
        html: base(`
          <h2>Profile generation failed</h2>
          <p>Hi ${s(data.name, 'there')},</p>
          <p>We had trouble generating your <strong>${s(data.platform)}</strong> profile. Our system will retry automatically.</p>
          <p>If this keeps happening, please contact support.</p>
        `),
      };
  }
}
