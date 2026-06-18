import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    linkedin: 'LinkedIn',
    github: 'GitHub',
    instagram: 'Instagram',
    facebook: 'Facebook',
    fiverr: 'Fiverr',
    upwork: 'Upwork',
    freelancer: 'Freelancer',
    tiktok: 'TikTok',
    twitter: 'Twitter / X',
  };
  return names[platform] ?? platform;
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    linkedin: '💼',
    github: '⌨️',
    instagram: '📸',
    facebook: '📘',
    fiverr: '🟢',
    freelancer: '🔵',
    tiktok: '🎵',
    twitter: '🐦',
  };
  return icons[platform] ?? '🔗';
}
