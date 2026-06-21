import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: { default: 'Prezence', template: '%s | Prezence' },
  description:
    'AI-powered personal branding for Cameroonian and sub-Saharan African youth.',
  manifest: '/manifest.json',
  themeColor: '#6366F1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prezence',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
