import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'Baseline — AI-Powered Persistent Health Memory',
    template: '%s | Baseline',
  },
  description:
    'Baseline helps you understand what changed before it becomes a crisis. AI-powered persistent health memory for elderly patients with Care Circle.',
  keywords: [
    'health memory',
    'elderly care',
    'care circle',
    'patient monitoring',
    'health timeline',
    'clinical decision support',
  ],
  openGraph: {
    title: 'Baseline — AI-Powered Persistent Health Memory',
    description: 'Understand what changed before it becomes a crisis.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
