import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'ProximityAuth Portal',
  description: 'Account management and mobile onboarding for ProximityAuth'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="px-6">
        <Nav />
        <main className="mx-auto w-full max-w-5xl py-8">{children}</main>
      </body>
    </html>
  );
}
