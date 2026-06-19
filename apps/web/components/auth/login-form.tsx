'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { loginAction, type AuthState } from '../../lib/actions/auth.actions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const initial: AuthState = {};

const AUTH_ASSETS = {
  logoFull: '/assets/brand/shared-logo-full@343x90.png',
  google: '/assets/social/shared-google@24x24.svg',
  apple: '/assets/social/shared-apple@24x24.svg',
  facebook: '/assets/social/shared-facebook@24x24.svg',
} as const;

function SocialOAuthRow() {
  return (
    <div className="flex items-center justify-center gap-3">
      {(
        [
          { src: AUTH_ASSETS.google, label: 'Google' },
          { src: AUTH_ASSETS.apple, label: 'Apple' },
          { src: AUTH_ASSETS.facebook, label: 'Facebook' },
        ] as const
      ).map((item) => (
        <button
          key={item.label}
          type="button"
          disabled
          aria-label={`Continue with ${item.label}`}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#cdd5e9] bg-white shadow-sm transition hover:bg-[#f5f7fc] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt="" width={24} height={24} />
        </button>
      ))}
    </div>
  );
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, initial);

  return (
    <div className="w-full">
      <Link href="/" className="mx-auto mb-8 flex w-[343px] max-w-full items-center gap-4 px-5">
        <Image
          src={AUTH_ASSETS.logoFull}
          alt="Prezence"
          width={343}
          height={90}
          className="h-[90px] w-auto max-w-full object-contain object-left"
          priority
        />
      </Link>

      <div className="flex flex-col gap-8 px-5 lg:px-0">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.3px] text-[#1a1a2e]">Log in</h1>
          <p className="mt-[22px] text-xl tracking-[-0.3px] text-[#1a1a2e]">
            New to Prezence?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#1d4e8a] underline decoration-solid underline-offset-2"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-8 max-w-[564px] text-[20.46px] leading-[26.85px] tracking-[-0.27px] text-[#787c91]">
            If you don&apos;t have an account it will be created when signing in for the first
            time.
          </p>
        </div>

        <Button
          type="button"
          variant="google"
          size="xl"
          disabled
          className="mx-auto w-full max-w-[345px] font-medium"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AUTH_ASSETS.google} alt="" width={24} height={24} />
          Log In with Google
        </Button>

        <SocialOAuthRow />

        <p className="text-center text-[17.9px] font-semibold tracking-[-0.27px] text-[#1a1a2e]">
          Continue another way
        </p>

        <form action={action} className="mx-auto flex w-full max-w-[345px] flex-col gap-4">
          <Input
            variant="auth"
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            variant="auth"
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#1d4e8a] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {state.error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <Button type="submit" variant="auth" size="xl" loading={isPending} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mx-auto max-w-[323px] text-center text-[15.35px] leading-[23px] tracking-[-0.23px] text-[#787c91]">
          By continuing, you&apos;re agreeing to our policies.
        </p>
      </div>
    </div>
  );
}
