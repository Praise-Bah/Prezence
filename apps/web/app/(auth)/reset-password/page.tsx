'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPasswordAction } from '../../../lib/actions/auth.actions';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await resetPasswordAction(token, newPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      window.setTimeout(() => router.push('/login'), 2000);
    }
  }

  if (success) {
    return (
      <div className="rounded-[10px] border border-[rgba(15,110,86,0.2)] bg-[#f0faf6] px-4 py-4 text-sm text-[#0f6e56]">
        Password reset! Redirecting to login…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Input
        variant="auth"
        label="New password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="••••••••"
        required
        minLength={8}
      />
      <Input
        variant="auth"
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
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
        {loading ? 'Resetting…' : 'Reset password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-[16px] bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-[#1a1a2e]">Set new password</h1>
        <p className="mt-2 text-sm text-[#888780]">
          Choose a strong password with at least 8 characters, one uppercase letter, one number, and one special character.
        </p>

        <Suspense fallback={<p className="mt-6 text-sm text-[#888780]">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-[#888780]">
          <Link href="/login" className="font-medium text-[#1d4e8a] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
