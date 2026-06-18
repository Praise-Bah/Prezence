import type { Metadata } from 'next';
import { getCurrentUser } from '../../../lib/auth';
import { Topbar } from '../../../components/layout/topbar';
import { ProfileHeader } from '../../../components/profile/profile-header';
import { ProfileForm } from '../../../components/profile/profile-form';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <Topbar user={user} title="Profile" />
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <ProfileHeader user={user} />
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}
