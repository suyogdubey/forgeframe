import type {Metadata} from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AI Creator Studio',
  description: 'A modular SaaS platform featuring advanced AI tools.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#09090b] text-zinc-300 selection:bg-indigo-500/30" suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
