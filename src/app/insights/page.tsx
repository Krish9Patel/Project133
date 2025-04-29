'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, BarChartHorizontalBig, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getJournalInsights } from '@/ai/flows/journal-insights'; // Assuming this path is correct
import type { JournalInsightsInput, JournalInsightsOutput } from '@/ai/flows/journal-insights';

// Mock data fetching functions (replace with actual API calls)
async function fetchJournalEntries(): Promise<JournalInsightsInput['journalEntries']> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return sample data (should come from user's stored entries)
  return [
    { content: 'Feeling great today! Very productive morning.', createdAt: new Date(2024, 6, 15).toISOString() },
    { content: 'A bit down, didn\'t sleep well. Feeling tired.', createdAt: new Date(2024, 6, 14).toISOString() },
    { content: 'Had a wonderful time with friends. Feeling happy and connected.', createdAt: new Date(2024, 6, 13).toISOString() },
    { content: 'Stressed about work project. Need to focus.', createdAt: new Date(2024, 6, 12).toISOString() },
     { content: 'Feeling peaceful after meditation.', createdAt: new Date(2024, 6, 11).toISOString() },
  ];
}

async function fetchMoodLogs(): Promise<JournalInsightsInput['moodLogs']> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // Return sample data (should come from user's stored logs)
  return [
    { moodRating: 5, timestamp: new Date(2024, 6, 15).toISOString() },
    { moodRating: 2, timestamp: new Date(2024, 6, 14).toISOString() },
    { moodRating: 5, timestamp: new Date(2024, 6, 13).toISOString() },
    { moodRating: 3, timestamp: new Date(2024, 6, 12).toISOString() },
     { moodRating: 4, timestamp: new Date(2024, 6, 11).toISOString() },
  ];
}


export default function InsightsPage() {
  const [insights, setInsights] = useState<JournalInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null); // Clear previous insights

    try {
      // Fetch necessary data (replace with actual authenticated API calls)
      const journalEntries = await fetchJournalEntries();
      const moodLogs = await fetchMoodLogs();

      if (journalEntries.length === 0 && moodLogs.length === 0) {
         setError("Not enough data to generate insights. Please add more journal entries or mood logs.");
         setIsLoading(false);
         return;
      }

      const inputData: JournalInsightsInput = { journalEntries, moodLogs };
      const result = await getJournalInsights(inputData);
      setInsights(result);
    } catch (err) {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights. Please try again later.");
      // More specific error handling could be added here
    } finally {
      setIsLoading(false);
    }
  };

   // Optionally, generate insights on initial load if desired
   // useEffect(() => {
   //   generateInsights();
   // }, []);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center gap-2">
          <BrainCircuit className="w-8 h-8" /> AI-Powered Insights
        </h1>
        <Button onClick={generateInsights} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate New Insights'}
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
          <Card className="shadow-lg md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig className="w-6 h-6 text-secondary"/> Overall Summary</CardTitle>
              <CardDescription>Key emotional themes and trends from your recent entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 leading-relaxed">{insights.summary}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Dominant Mood</CardTitle>
               <CardDescription>The most frequent or impactful mood observed.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-2xl font-semibold text-primary">{insights.dominantMood || 'Not enough data'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Sentiment Keywords</CardTitle>
              <CardDescription>Words associated with positive and negative feelings in your journal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <h4 className="font-semibold text-green-600 mb-2">Positive Keywords:</h4>
                   {insights.positiveKeywords && insights.positiveKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                           {insights.positiveKeywords.slice(0, 10).map((keyword, index) => ( // Limit display
                            <span key={index} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{keyword}</span>
                           ))}
                       </div>
                   ) : (
                      <p className="text-sm text-muted-foreground italic">None identified.</p>
                   )}
               </div>
               <div>
                  <h4 className="font-semibold text-red-600 mb-2">Negative Keywords:</h4>
                   {insights.negativeKeywords && insights.negativeKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                           {insights.negativeKeywords.slice(0, 10).map((keyword, index) => ( // Limit display
                            <span key={index} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{keyword}</span>
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
         <div className="text-center py-16 text-muted-foreground">
            <BrainCircuit className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-4">Ready to gain insights into your well-being?</p>
            <p>Click "Generate New Insights" to analyze your recent journal entries and mood logs.</p>
         </div>
      )}

       <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>AI insights are generated based on your data and may not capture all nuances. They are intended for reflection, not as a replacement for professional advice.</p>
          <p>Your data privacy is important. Insights are processed securely.</p>
       </footer>
    </div>
  );
}


// Skeleton Component for Loading State
function InsightsSkeleton() {
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <Card className="shadow-lg md:col-span-2">
         <CardHeader>
           <Skeleton className="h-6 w-1/3 mb-2" />
           <Skeleton className="h-4 w-2/3" />
         </CardHeader>
         <CardContent className="space-y-2">
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-3/4" />
         </CardContent>
       </Card>
       <Card className="shadow-lg">
         <CardHeader>
           <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
         </CardHeader>
         <CardContent>
           <Skeleton className="h-8 w-1/3" />
         </CardContent>
       </Card>
       <Card className="shadow-lg">
         <CardHeader>
           <Skeleton className="h-6 w-1/2 mb-2" />
           <Skeleton className="h-4 w-3/4" />
         </CardHeader>
         <CardContent className="space-y-4">
            <div>
               <Skeleton className="h-5 w-1/4 mb-2" />
               <div className="flex flex-wrap gap-2">
                   <Skeleton className="h-5 w-16 rounded-full" />
                   <Skeleton className="h-5 w-20 rounded-full" />
                   <Skeleton className="h-5 w-12 rounded-full" />
               </div>
            </div>
            <div>
               <Skeleton className="h-5 w-1/4 mb-2" />
               <div className="flex flex-wrap gap-2">
                   <Skeleton className="h-5 w-16 rounded-full" />
                   <Skeleton className="h-5 w-20 rounded-full" />
               </div>
            </div>
         </CardContent>
       </Card>
     </div>
  );
}
