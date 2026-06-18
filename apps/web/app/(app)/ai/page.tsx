import type { Metadata } from 'next';
import { getCurrentUser } from '../../../lib/auth';
import { displayNameFromEmail } from '../../../lib/user-display';
import { Topbar } from '../../../components/layout/topbar';
import { AiChat } from '../../../components/ai/ai-chat';

export const metadata: Metadata = { title: 'Prezence AI' };

export default async function AiPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Prezence AI" />
      <AiChat userDisplayName={displayNameFromEmail(user.email)} />
    </div>
  );
}
