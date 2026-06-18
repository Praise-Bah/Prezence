import type { Metadata } from 'next';
import { getCurrentUser } from '../../../lib/auth';
import { Topbar } from '../../../components/layout/topbar';
import { SettingsForm } from '../../../components/settings/settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <Topbar user={user} title="Settings" />
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-[28px] font-medium leading-[42px] text-[#1a1a2e]">
              Account Settings
            </h1>
            <p className="mt-1 text-base text-[#888780]">
              Manage your profile, preferences, and security settings
            </p>
          </div>
          <SettingsForm user={user} />
        </div>
      </div>
    </div>
  );
}
