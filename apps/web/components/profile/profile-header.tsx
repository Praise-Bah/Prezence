import Image from 'next/image';
import type { UserProfile } from '@prezence/types';
import { Badge } from '../ui/badge';
import { displayNameFromEmail } from '../../lib/user-display';

const AVATAR = '/assets/placeholders/shared-user-avatar@72x72.webp';

const planVariant: Record<string, 'default' | 'success' | 'info' | 'purple'> = {
  free: 'default',
  professional: 'purple',
  elite: 'success',
};

interface ProfileHeaderProps {
  user: UserProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const name = displayNameFromEmail(user.email);

  return (
    <div
      className="rounded-[15px] border-[1.5px] border-white px-6 py-8 shadow-[0px_2px_5.5px_0px_rgba(0,0,0,0.02)]"
      style={{
        backgroundImage:
          'linear-gradient(167deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.8) 110.84%)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Image
            src={AVATAR}
            alt=""
            width={84}
            height={84}
            className="h-[84px] w-[84px] rounded-full object-cover"
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-[#2d3748]">{name}</h2>
              <Badge variant={planVariant[user.plan] ?? 'default'} className="capitalize">
                {user.plan} plan
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[#718096]">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
