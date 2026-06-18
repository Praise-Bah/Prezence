import Image from 'next/image';

const PLATFORM_ASSETS: Record<string, { src: string; width: number; height: number }> = {
  linkedin: { src: '/assets/platforms/shared-platform-logo@36x36.svg', width: 36, height: 36 },
  fiverr: { src: '/assets/platforms/shared-fiverr@25x25.svg', width: 25, height: 25 },
  upwork: { src: '/assets/platforms/shared-upwork@40x24.svg', width: 40, height: 24 },
  freelancer: { src: '/assets/platforms/shared-freelancer@39x29.svg', width: 39, height: 29 },
  instagram: { src: '/assets/platforms/shared-instagram@18x18.svg', width: 18, height: 18 },
  twitter: { src: '/assets/platforms/shared-twitter@21x21.svg', width: 21, height: 21 },
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#1a1a2e]" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.85 1.23 1.85 1.23 1.07 1.835 2.809 1.305 3.495.997.108-.775.418-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#1a1a2e]" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  if (platform === 'github') {
    return (
      <span className={className}>
        <GitHubIcon />
      </span>
    );
  }

  if (platform === 'tiktok') {
    return (
      <span className={className}>
        <TikTokIcon />
      </span>
    );
  }

  const asset = PLATFORM_ASSETS[platform] ?? PLATFORM_ASSETS.linkedin;
  return (
    <Image
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      className={className}
      aria-hidden
    />
  );
}
