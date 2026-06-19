import { redirect } from 'next/navigation';
import { requireUser } from '../../../lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== 'system_admin' && user.role !== 'support') {
    redirect('/dashboard');
  }
  return <>{children}</>;
}
