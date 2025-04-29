import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for clean look
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Mindful Journey',
  description:
    'Your personal space for mental well-being, journaling, and reflection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <main className="flex min-h-screen flex-col items-center">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
