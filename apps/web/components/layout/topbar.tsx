import type { UserProfile } from '@prezence/types';
import { Badge } from '../ui/badge';

interface TopbarProps {
  user: UserProfile;
  title: string;
}

const planVariant: Record<string, 'default' | 'success' | 'info' | 'purple'> = {
  free: 'default',
  starter: 'info',
  professional: 'purple',
  elite: 'success',
};

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant={planVariant[user.plan] ?? 'default'} className="capitalize">
          {user.plan}
        </Badge>
        <span className="text-sm text-gray-500">{user.email}</span>
      </div>
    </header>
  );
}
