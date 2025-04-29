// src/app/page.tsx
'use client'; // Need client-side hooks for auth state

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpenText, Smile, Timer, BrainCircuit, LogIn, UserPlus, LogOut } from 'lucide-react'; // Added auth icons
import { isAuthenticated, logout } from '@/lib/auth'; // Import auth functions

export default function Home() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    setIsUserAuthenticated(isAuthenticated());
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserAuthenticated(false); // Update state after logout
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background via-muted to-background">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
          Mindful Journey
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          Your personal, secure space to cultivate mental well-being through reflection, tracking, and mindfulness.
        </p>
      </header>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mb-12">
        <FeatureCard
          icon={<BookOpenText className="w-10 h-10 text-primary" />}
          title="Journaling"
          description="Record your thoughts and feelings securely with our rich text editor."
          link="/journal"
          linkText="Go to Journal" // Updated text
        />
        <FeatureCard
          icon={<Smile className="w-10 h-10 text-secondary" />}
          title="Mood Tracking"
          description="Log your daily mood and visualize patterns over time with insightful charts."
          link="/mood"
          linkText="Track Mood"
        />
        <FeatureCard
          icon={<Timer className="w-10 h-10 text-accent" />}
          title="Meditation Timer"
          description="Take a mindful pause with our simple and customizable meditation timer."
          link="/meditation"
          linkText="Begin Meditation"
        />
        <FeatureCard
          icon={<BrainCircuit className="w-10 h-10 text-primary/80" />}
          title="AI Insights"
          description="Discover emotional themes and trends in your entries with AI-powered analysis."
          link="/insights"
          linkText="Get Insights"
        />
      </div>

       {/* Authentication Actions */}
      <div className="w-full max-w-6xl text-center space-y-8">
         <div className="flex justify-center space-x-4">
          {!isUserAuthenticated ? (
            <>
              <Button asChild size="lg">
                <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" /> Login
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                 <Link href="/register">
                     <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                 </Link>
              </Button>
            </>
          ) : (
             <Button onClick={handleLogout} variant="outline" size="lg">
                 <LogOut className="mr-2 h-5 w-5" /> Logout
             </Button>
          )}
        </div>

         {/* Footer */}
         <footer className="text-sm text-muted-foreground mt-16">
          <p>&copy; {new Date().getFullYear()} Mindful Journey. All rights reserved.</p>
          <p className="mt-1">Prioritizing your privacy and security.</p>
         </footer>
      </div>
    </div>
  );
}

// Feature Card Component (no changes needed)
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

function FeatureCard({ icon, title, description, link, linkText }: FeatureCardProps) {
  return (
    <Card className="flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card"> {/* Added bg-card */}
      <CardHeader>
        <div className="mb-4 p-4 bg-primary/10 rounded-full inline-block">
         {icon}
        </div>
        <CardTitle className="text-2xl font-semibold text-card-foreground">{title}</CardTitle> {/* Use card-foreground */}
        <CardDescription className="text-card-foreground/70">{description}</CardDescription> {/* Use card-foreground */}
      </CardHeader>
      <CardContent className="flex-grow flex items-end">
        <Button asChild variant="link" className="text-primary hover:text-primary/80">
          <Link href={link}>{linkText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
