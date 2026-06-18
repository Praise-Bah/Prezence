import type { Metadata } from 'next';
import { RegisterForm } from '../../../components/auth/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <div className="min-h-full w-full bg-[#e7f2f9] py-4 lg:min-h-screen lg:py-0">
      <RegisterForm />
    </div>
  );
}
