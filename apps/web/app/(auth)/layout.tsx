import Image from 'next/image';

const AUTH_ASSETS = {
  splitPanel: '/assets/backgrounds/auth-split-panel@959x1112.webp',
} as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#ecf7ff]">
      {/* Form column — left per Figma (440:7951 / 440:7994) */}
      <div className="flex w-full flex-1 flex-col items-center justify-center px-5 py-10 lg:w-1/2 lg:max-w-[50%] lg:px-[114px] lg:py-16">
        <div className="w-full max-w-[646px]">{children}</div>
      </div>

      {/* Decorative panel — right per Figma */}
      <aside className="relative hidden min-h-screen flex-1 lg:block">
        <Image
          src={AUTH_ASSETS.splitPanel}
          alt=""
          width={959}
          height={1112}
          className="absolute inset-0 h-full w-full object-cover"
          priority
          aria-hidden
        />
        <div className="absolute inset-x-0 top-[81px] flex justify-center px-8">
          <p className="max-w-[657px] text-center text-[36px] font-bold leading-[1.2] tracking-[-0.21px] text-white">
            Get gig across your favorite platforms
          </p>
        </div>
      </aside>
    </div>
  );
}
