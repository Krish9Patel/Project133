// src/app/mood/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format, subDays, startOfDay } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart" // Removed Legend imports initially
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, TooltipProps } from "recharts"
import { Smile, Frown, Meh, Laugh, Angry, Loader2, AlertCircle } from 'lucide-react'; // Added Loader2, AlertCircle
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, isAuthenticated, logout } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Data structure matching backend serializer
interface MoodLog {
  id: number; // Changed to number
  mood_rating: number; // Field name from Django model
  timestamp: string; // Keep as string from API
  user?: number;
  user_email?: string;
}

// Mood options with icons and labels
const moodOptions = [
  { value: 1, label: 'Awful', icon: <Angry className="w-6 h-6 text-red-500" />, color: "hsl(var(--chart-1))" }, // Use chart colors
  { value: 2, label: 'Bad', icon: <Frown className="w-6 h-6 text-orange-500" />, color: "hsl(var(--chart-2))" },
  { value: 3, label: 'Okay', icon: <Meh className="w-6 h-6 text-yellow-500" />, color: "hsl(var(--chart-3))" },
  { value: 4, label: 'Good', icon: <Smile className="w-6 h-6 text-lime-500" />, color: "hsl(var(--chart-4))" },
  { value: 5, label: 'Great', icon: <Laugh className="w-6 h-6 text-green-500" />, color: "hsl(var(--chart-5))" },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function MoodPage() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<string>("7"); // Default to 7 days
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoggingMood, setIsLoggingMood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

   // --- Check Authentication ---
   useEffect(() => {
    if (!isAuthenticated()) {
        toast({ title: "Unauthorized", description: "Please log in to track your mood.", variant: "destructive" });
        router.push('/login');
    }
   }, [router, toast]);

   // --- Fetch Mood Logs ---
   const fetchMoodLogs = useCallback(async () => {
     if (!isAuthenticated()) return;
     setIsLoadingLogs(true);
     setError(null);
     try {
        // Construct URL with query parameters for time range
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), parseInt(timeRange) -1), 'yyyy-MM-dd');
        const url = `${API_BASE_URL}/api/moodlog/?start_date=${startDate}&end_date=${endDate}`;

        const response = await fetchWithAuth(url);
        if (!response.ok) {
            if (response.status === 401) {
                 toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
                 router.push('/login');
                 return;
            }
            throw new Error(`Failed to fetch mood logs: ${response.statusText}`);
        }
        const data = await response.json();
        setMoodLogs(data.results || data || []); // Handle potential pagination
     } catch (error: any) {
        console.error('Error fetching mood logs:', error);
        setError(error.message || "Could not load mood history.");
        toast({ title: "Error", description: error.message || "Could not load mood history.", variant: "destructive" });
        if (error.message.includes('Session expired')) {
             // Redirect handled by fetchWithAuth
        }
     } finally {
        setIsLoadingLogs(false);
     }
   }, [timeRange, toast, router]); // Depend on timeRange

   // Fetch logs on mount and when timeRange changes
   useEffect(() => {
     fetchMoodLogs();
   }, [fetchMoodLogs]);


  const handleLogMood = async () => {
    if (!selectedMood || !isAuthenticated()) return;
    setIsLoggingMood(true);
    setError(null);

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/moodlog/`, {
            method: 'POST',
            body: JSON.stringify({ mood_rating: parseInt(selectedMood, 10) }),
             // fetchWithAuth handles headers
        });

        const newLog = await response.json();

        if (!response.ok) {
            const errorMsg = newLog.detail || newLog.mood_rating?.[0] || "Failed to log mood.";
            throw new Error(errorMsg);
        }

        // Add to local state immediately for responsiveness
        // Note: The timestamp from the backend might slightly differ
        setMoodLogs([newLog, ...moodLogs]);
        toast({ title: "Success", description: "Mood logged successfully!" });
        setSelectedMood(undefined); // Reset selection
        // Optionally refetch logs to ensure consistency, or rely on local update
        // fetchMoodLogs();

    } catch (error: any) {
        console.error('Error logging mood:', error);
        setError(error.message || "Could not log mood.");
        toast({ title: "Error", description: error.message || "Could not log mood.", variant: "destructive" });
        if (error.message.includes('Session expired')) {
            // Redirect handled by fetchWithAuth
        }
    } finally {
        setIsLoggingMood(false);
    }
  };

  // Prepare data for the chart
  const chartData = useMemo(() => {
    const days = parseInt(timeRange, 10);
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, days - 1));

    // Filter logs within the selected date range (already done by API ideally, but double-check)
    const logsInRange = moodLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
    });

    // Aggregate moods per day (use the latest log for the day if multiple)
    const dailyDataMap = new Map<string, { rating: number; timestamp: Date }>();
    logsInRange.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Sort oldest to newest

    logsInRange.forEach(log => {
      const dayKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
      dailyDataMap.set(dayKey, { rating: log.mood_rating, timestamp: new Date(log.timestamp) }); // Store rating and timestamp
    });

    // Create data points for the last 'days' days
    const dataPoints = [];
    for (let i = 0; i < days; i++) {
      const date = startOfDay(subDays(endDate, i));
      const dateKey = format(date, 'yyyy-MM-dd');
      const logData = dailyDataMap.get(dateKey);
      dataPoints.push({
        date: format(date, 'MMM d'), // Format for X-axis label
        mood: logData ? logData.rating : null, // Use null if no data
        fullDate: date, // Keep full date for tooltip or other uses
        timestamp: logData ? logData.timestamp : null,
      });
    }

    return dataPoints.reverse(); // Show oldest to newest

  }, [moodLogs, timeRange]);

  const chartConfig = useMemo(() => {
     const config: ChartConfig = {};
     moodOptions.forEach(opt => {
        config[`mood${opt.value}`] = { // Key for config lookup
            label: opt.label,
            color: opt.color,
            icon: () => React.cloneElement(opt.icon, { className: "w-4 h-4" })
        };
     });
     config['mood'] = { label: "Mood", color: "hsl(var(--primary))" }; // Default/fallback
     return config;
  }, []);


  // Custom Tooltip Content for Bar Chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload; // Access the full data point object
        const rating = data.mood;

        if (rating !== null) {
            const moodInfo = moodOptions.find(opt => opt.value === rating);
            return (
              <div className="rounded-lg border bg-popover p-2 shadow-sm text-popover-foreground">
                <div className="font-medium mb-1">{label}</div>
                 {moodInfo && (
                   <div className="flex items-center gap-1.5">
                     {React.cloneElement(moodInfo.icon, { className: "w-4 h-4" })}
                     <span>{moodInfo.label} ({rating}/5)</span>
                   </div>
                  )}
                 {/* Optional: Show exact timestamp */}
                 {/* {data.timestamp && <div className="text-xs text-muted-foreground mt-1">{format(data.timestamp, 'p')}</div>} */}
              </div>
            );
        } else {
             // Show tooltip indicating no data for the date
             return (
                <div className="rounded-lg border bg-popover p-2 shadow-sm text-popover-foreground">
                   <div className="font-medium mb-1">{label}</div>
                   <div className="text-xs text-muted-foreground">No data logged</div>
                </div>
              );
        }
      }
      return null;
  };

  // --- Render Logic ---
  const renderChart = () => {
    if (isLoadingLogs) {
      return <Skeleton className="h-[250px] w-full rounded-md" />;
    }
     if (error && !isLoadingLogs) {
        return (
            <Alert variant="destructive" className="h-[250px] flex flex-col items-center justify-center">
                 <AlertCircle className="h-6 w-6 mb-2" />
                 <AlertTitle>Error Loading Chart</AlertTitle>
                 <AlertDescription>{error || "Could not load mood history."}</AlertDescription>
            </Alert>
        );
    }
    if (chartData.length === 0 && !isLoadingLogs) {
      return (
        <div className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-center">No mood data available for this period. Start logging your mood!</p>
        </div>
      );
    }
    return (
       <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 6)}
            />
             <YAxis
              domain={[0, 5.5]} // Extend domain slightly for better visualization
              allowDecimals={false}
              tickCount={6} // Ticks for 0, 1, 2, 3, 4, 5
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={30} // Give Y-axis more space
             />
             <ChartTooltip
                cursor={false} // Disable default cursor line
                content={<CustomTooltip />}
              />
            {/* Define Bars - need to customize fill based on value */}
             <Bar dataKey="mood" radius={4} >
                {/* Customize bar color based on mood value */}
                {chartData.map((entry, index) => {
                    const moodInfo = moodOptions.find(opt => opt.value === entry.mood);
                    const fillColor = moodInfo ? moodInfo.color : "hsl(var(--muted))"; // Default color if no mood
                    return <div key={`cell-${index}`} fill={fillColor} />; // Using fill on Cell is for Pie, need custom logic or maybe multiple Bar series
                })}
                 {/* Fallback: Single color bar if dynamic coloring is complex */}
                 {/* <Bar dataKey="mood" fill="var(--color-mood)" radius={4} /> */}
             </Bar>
             {/* Alternative for coloring: Use multiple <Bar> components if necessary, filtering data */}

          </BarChart>
        </ChartContainer>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <Smile className="w-8 h-8"/> Mood Tracker
        </h1>
         <p className="text-muted-foreground">Log your daily mood and observe your emotional patterns.</p>
      </header>

      {/* Mood Logging Section */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>Select the option that best represents your current mood.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMood}
            onValueChange={setSelectedMood}
            className="flex flex-wrap gap-4 justify-center"
            aria-label="Select Mood"
            disabled={isLoggingMood} // Disable while logging
          >
            {moodOptions.map((option) => (
              <div key={option.value} className="flex flex-col items-center space-y-2">
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`mood-${option.value}`}
                  className="sr-only"
                  aria-label={option.label}
                   disabled={isLoggingMood}
                />
                <Label
                  htmlFor={`mood-${option.value}`}
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 w-24 h-24
                  ${isLoggingMood ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${selectedMood === option.value.toString()
                    ? 'border-primary ring-2 ring-primary bg-primary/10'
                    : 'border-border hover:border-accent hover:bg-accent/10'}`
                  }
                >
                  {option.icon}
                  <span className="mt-2 text-sm font-medium text-center">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-center mt-6">
            <Button onClick={handleLogMood} disabled={!selectedMood || isLoggingMood}>
              {isLoggingMood ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoggingMood ? 'Logging...' : "Log Today's Mood"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mood History Chart Section */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
           <div className="flex-1">
             <CardTitle>Mood History</CardTitle>
             <CardDescription>Your mood ratings over the selected period.</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange} disabled={isLoadingLogs}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
            {renderChart()}
        </CardContent>
      </Card>

        {/* Logout Button Example */}
         <div className="mt-8 text-center">
             <Button variant="outline" onClick={logout}>Logout</Button>
         </div>
    </div>
  );
}
