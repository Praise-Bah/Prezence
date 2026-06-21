import { requireUser } from '../../lib/auth';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}
