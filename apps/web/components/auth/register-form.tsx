'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type AuthState } from '../../lib/actions/auth.actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initial: AuthState = {};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'camfranglais', label: 'Camfranglais' },
];

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initial);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Start building your personal brand for free</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <form action={action} className="flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
          <Input
            label="Country code"
            name="country_code"
            placeholder="CM"
            defaultValue="CM"
            hint="2-letter ISO code e.g. CM, NG, GH"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="language" className="text-sm font-medium text-gray-700">
              Preferred language
            </label>
            <select
              id="language"
              name="language"
              defaultValue="en"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <Button type="submit" loading={isPending} className="w-full mt-2">
            Create account
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
