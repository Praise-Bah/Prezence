import type { Metadata } from 'next';
import { LoginForm } from '../../../components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-full w-full bg-[#c9e3ff] py-4 lg:min-h-screen lg:py-0">
      <LoginForm />
    </div>
  );
}
