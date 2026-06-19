import type { Metadata } from 'next';
import { LoginForm } from '../../../components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: 'Sign-in failed. Please try again or use email and password.',
  oauth_no_email: 'Your social account did not share an email address. Please sign in with email.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const errorKey = typeof searchParams.error === 'string' ? searchParams.error : undefined;
  const oauthError = errorKey ? (OAUTH_ERRORS[errorKey] ?? 'Something went wrong. Please try again.') : undefined;

  return (
    <div className="min-h-full w-full bg-[#c9e3ff] py-4 lg:min-h-screen lg:py-0">
      <LoginForm oauthError={oauthError} />
    </div>
  );
}
