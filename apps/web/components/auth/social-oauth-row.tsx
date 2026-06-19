import Link from 'next/link';

const AUTH_ASSETS = {
  google: '/assets/social/shared-google@24x24.svg',
  apple: '/assets/social/shared-apple@24x24.svg',
  facebook: '/assets/social/shared-facebook@24x24.svg',
} as const;

const BASE_CLASS =
  'flex h-12 w-12 items-center justify-center rounded-xl border border-[#cdd5e9] bg-white shadow-sm transition hover:bg-[#f5f7fc]';

export function SocialOAuthRow() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href="/api/auth/social/google"
        aria-label="Continue with Google"
        className={BASE_CLASS}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AUTH_ASSETS.google} alt="" width={24} height={24} />
      </Link>

      <button
        type="button"
        disabled
        title="Apple Sign-In coming soon"
        aria-label="Continue with Apple (coming soon)"
        className={`${BASE_CLASS} cursor-not-allowed opacity-50`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AUTH_ASSETS.apple} alt="" width={24} height={24} />
      </button>

      <Link
        href="/api/auth/social/facebook"
        aria-label="Continue with Facebook"
        className={BASE_CLASS}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AUTH_ASSETS.facebook} alt="" width={24} height={24} />
      </Link>
    </div>
  );
}

export function GoogleSignInButton() {
  return (
    <Link
      href="/api/auth/social/google"
      className="mx-auto flex w-full max-w-[345px] items-center justify-center gap-3 rounded-xl border border-[#cdd5e9] bg-white px-6 py-3.5 text-base font-medium text-[#1a1a2e] shadow-sm transition hover:bg-[#f5f7fc]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={AUTH_ASSETS.google} alt="" width={24} height={24} />
      Continue with Google
    </Link>
  );
}
