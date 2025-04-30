// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font for clean look
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Link from 'next/link'; 
import { Button } from '@/components/ui/button'; 
import { HomeIcon } from 'lucide-react';
// Optional: Import an AuthProvider if you create one for context
// import { AuthProvider } from '@/context/AuthContext'; // Example path

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
        <div className="absolute top-4 left-4 z-50"> {/* Basic absolute positioning */}
          <Button asChild variant="outline" size="icon">
            <Link href="/" aria-label="Home">
              <HomeIcon className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        {/* Optional: Wrap with AuthProvider if using context */}
        {/* <AuthProvider> */}
          {/* Consider adding a Navigation component here */}
          <main className="flex min-h-screen flex-col items-center pt-16 md:pt-20"> {/* Add padding top for potential fixed nav */}
            {children}
          </main>
          <Toaster />
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}
