import type { Metadata } from 'next';
import { LandingPage } from '../components/landing/landing-page';

export const metadata: Metadata = {
  title: 'Prezence — AI Personal Branding for African Youth',
  description:
    'Prezence interviews you, builds your profiles on LinkedIn, Fiverr, Instagram, and more — then keeps them updated automatically. Built for African youth. Designed for global reach.',
};

export default function Page() {
  return <LandingPage />;
}
