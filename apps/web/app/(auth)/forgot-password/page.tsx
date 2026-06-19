'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { forgotPasswordAction } from '../../../lib/actions/auth.actions';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

// Note: metadata can't be used with 'use client' — defined in layout
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await forgotPasswordAction(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-[16px] bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-[#1a1a2e]">Forgot password?</h1>
        <p className="mt-2 text-sm text-[#888780]">
          Enter your email and we'll send you a reset link.
        </p>

        {submitted ? (
          <div className="mt-6 rounded-[10px] border border-[rgba(15,110,86,0.2)] bg-[#f0faf6] px-4 py-4 text-sm text-[#0f6e56]">
            Check your inbox — if that email is registered, a reset link is on its way.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              variant="auth"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {error && (
              <p className="rounded-[10px] border border-[rgba(192,57,43,0.2)] bg-[rgba(192,57,43,0.05)] px-4 py-3 text-sm text-[#c0392b]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="auth"
              size="xl"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#888780]">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-[#1d4e8a] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
