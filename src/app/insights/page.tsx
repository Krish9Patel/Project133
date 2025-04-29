// src/app/insights/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, BarChartHorizontalBig, AlertCircle, Loader2, Info } from 'lucide-react'; // Added Loader2, Info
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getJournalInsights } from '@/ai/flows/journal-insights';
import type { JournalInsightsInput, JournalInsightsOutput } from '@/ai/flows/journal-insights';
import { fetchWithAuth, isAuthenticated, logout } from '@/lib/auth'; // Import auth functions
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { JournalEntry } from '@/app/journal/page'; // Assuming interface exists in journal page
import type { MoodLog } from '@/app/mood/page'; // Assuming interface exists in mood page

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function InsightsPage() {
  const [insights, setInsights] = useState<JournalInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false); // Separate state for data fetching
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedData, setHasFetchedData] = useState(false); // Track if data fetch attempt was made
  const { toast } = useToast();
  const router = useRouter();

  // --- Check Authentication ---
  useEffect(() => {
    if (!isAuthenticated()) {
        toast({ title: "Unauthorized", description: "Please log in to view insights.", variant: "destructive" });
        router.push('/login');
    }
  }, [router, toast]);

  // --- Data Fetching Functions ---
  const fetchJournalEntries = useCallback(async (): Promise<JournalEntry[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/journal/?limit=50`); // Fetch recent entries (adjust limit?)
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    const data = await response.json();
    return data.results || data || [];
  }, []);

  const fetchMoodLogs = useCallback(async (): Promise<MoodLog[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/moodlog/?limit=50`); // Fetch recent logs
    if (!response.ok) throw new Error('Failed to fetch mood logs');
    const data = await response.json();
    return data.results || data || [];
  }, []);

  // --- Generate Insights Function ---
  const generateInsights = async () => {
     if (!isAuthenticated()) {
        toast({ title: "Unauthorized", description: "Please log in first.", variant: "destructive" });
        router.push('/login');
        return;
    }

    setIsLoading(true); // Loading state for the entire process
    setIsFetchingData(true); // Specifically for data fetching part
    setError(null);
    setInsights(null); // Clear previous insights
    setHasFetchedData(true); // Mark that data fetch was attempted

    try {
      // 1. Fetch necessary data from backend
      const [journalEntriesData, moodLogsData] = await Promise.all([
        fetchJournalEntries(),
        fetchMoodLogs()
      ]);
      setIsFetchingData(false); // Data fetching complete

      if (journalEntriesData.length === 0 && moodLogsData.length === 0) {
         setError("Not enough data to generate insights. Please add more journal entries or mood logs.");
         toast({ title: "Insufficient Data", description: "Add more entries or logs first.", variant: "default"});
         setIsLoading(false);
         return;
      }

       // 2. Prepare input for the AI flow
        // Map backend data to the structure expected by the AI flow
       const journalInput = journalEntriesData.map(entry => ({
           content: entry.content, // Assuming content is plain text or AI can handle HTML
           createdAt: entry.created_at,
       }));
       const moodInput = moodLogsData.map(log => ({
           moodRating: log.mood_rating,
           timestamp: log.timestamp,
       }));

      const inputData: JournalInsightsInput = {
           journalEntries: journalInput,
           moodLogs: moodInput
      };


      // 3. Call the Genkit AI flow
      console.log("Calling getJournalInsights with input:", inputData);
      const result = await getJournalInsights(inputData);
      console.log("Received insights:", result);
      setInsights(result);
      toast({ title: "Insights Generated", description: "Successfully analyzed your data." });

    } catch (err: any) {
      console.error("Error generating insights:", err);
      setError(`Failed to generate insights: ${err.message || 'Please try again later.'}`);
      toast({ title: "Error", description: `Insight generation failed: ${err.message}`, variant: "destructive" });
       if (err.message.includes('Session expired')) {
             // Redirect handled by fetchWithAuth
       }
    } finally {
      setIsLoading(false);
      setIsFetchingData(false); // Ensure this is false even on error
    }
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2 text-center md:text-left">
          <BrainCircuit className="w-8 h-8" /> AI-Powered Insights
        </h1>
        <Button onClick={generateInsights} disabled={isLoading}>
           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
           {isLoading ? (isFetchingData ? 'Fetching Data...' : 'Generating...') : 'Generate New Insights'}
        </Button>
      </header>

       {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {isLoading ? (
        <InsightsSkeleton />
      ) : insights ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg md:col-span-2 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig className="w-6 h-6 text-secondary"/> Overall Summary</CardTitle>
              <CardDescription>Key emotional themes and trends from your recent entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-card-foreground/90 leading-relaxed whitespace-pre-wrap">{insights.summary}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-card">
            <CardHeader>
              <CardTitle>Dominant Mood</CardTitle>
               <CardDescription>The most frequent or impactful mood observed.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-2xl font-semibold text-primary">{insights.dominantMood || 'Not enough data'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-card">
            <CardHeader>
              <CardTitle>Sentiment Keywords</CardTitle>
              <CardDescription>Words or phrases associated with positive and negative feelings in your journal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Positive Keywords */}
               <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Positive Themes:</h4>
                   {insights.positiveKeywords && insights.positiveKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                           {/* Assuming keywords might be longer phrases now */}
                           {insights.positiveKeywords.slice(0, 10).map((keyword, index) => (
                            <span key={`pos-${index}`} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-300 dark:border-green-700">
                                {keyword}
                            </span>
                           ))}
                       </div>
                   ) : (
                      <p className="text-sm text-muted-foreground italic">None identified.</p>
                   )}
               </div>
                {/* Negative Keywords */}
               <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Negative Themes:</h4>
                   {insights.negativeKeywords && insights.negativeKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                           {insights.negativeKeywords.slice(0, 10).map((keyword, index) => (
                            <span key={`neg-${index}`} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-300 dark:border-red-700">
                               {keyword}
                            </span>
                           ))}
                       </div>
                   ) : (
                      <p className="text-sm text-muted-foreground italic">None identified.</p>
                   )}
               </div>
            </CardContent>
          </Card>
        </div>
      ) : (
         // Show initial message only if data hasn't been fetched yet
         !hasFetchedData && (
             <div className="text-center py-16 text-muted-foreground bg-card rounded-lg shadow">
                <BrainCircuit className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">Ready to gain insights into your well-being?</p>
                <p>Click "Generate New Insights" to analyze your recent journal entries and mood logs.</p>
             </div>
         )
      )}

       <footer className="mt-12 text-center text-xs text-muted-foreground">
         <Alert variant="default" className="inline-flex items-center gap-2 text-left max-w-prose mx-auto bg-muted/50 border-primary/20">
              <Info className="h-4 w-4 text-primary flex-shrink-0" />
               <AlertDescription>
                AI insights are generated based on your data and may not capture all nuances. They are intended for reflection, not as a replacement for professional advice. Your data privacy is important; insights are processed securely.
               </AlertDescription>
         </Alert>
         {/* Logout Button Example */}
         <div className="mt-8">
             <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
         </div>
       </footer>
    </div>
  );
}


// Skeleton Component for Loading State
function InsightsSkeleton() {
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
       <Card className="shadow-lg md:col-span-2 bg-card">
         <CardHeader>
           <Skeleton className="h-6 w-1/3 mb-2 bg-muted" />
           <Skeleton className="h-4 w-2/3 bg-muted" />
         </CardHeader>
         <CardContent className="space-y-2">
           <Skeleton className="h-4 w-full bg-muted" />
           <Skeleton className="h-4 w-full bg-muted" />
           <Skeleton className="h-4 w-3/4 bg-muted" />
         </CardContent>
       </Card>
       <Card className="shadow-lg bg-card">
         <CardHeader>
           <Skeleton className="h-6 w-1/2 mb-2 bg-muted" />
            <Skeleton className="h-4 w-3/4 bg-muted" />
         </CardHeader>
         <CardContent>
           <Skeleton className="h-8 w-1/3 bg-muted" />
         </CardContent>
       </Card>
       <Card className="shadow-lg bg-card">
         <CardHeader>
           <Skeleton className="h-6 w-1/2 mb-2 bg-muted" />
           <Skeleton className="h-4 w-3/4 bg-muted" />
         </CardHeader>
         <CardContent className="space-y-4">
            <div>
               <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
               <div className="flex flex-wrap gap-2">
                   <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                   <Skeleton className="h-5 w-20 rounded-full bg-muted" />
                   <Skeleton className="h-5 w-12 rounded-full bg-muted" />
               </div>
            </div>
            <div>
               <Skeleton className="h-5 w-1/4 mb-2 bg-muted" />
               <div className="flex flex-wrap gap-2">
                   <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                   <Skeleton className="h-5 w-20 rounded-full bg-muted" />
               </div>
            </div>
         </CardContent>
       </Card>
     </div>
  );
}
