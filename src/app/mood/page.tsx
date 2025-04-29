'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format, subDays, startOfDay } from 'date-fns';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, TooltipProps, LegendProps } from "recharts" // Changed to BarChart
import { Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


// Sample data structure for mood logs
interface MoodLog {
  id: string;
  moodRating: number; // 1-5 scale
  timestamp: Date;
}

// Mood options with icons and labels
const moodOptions = [
  { value: 1, label: 'Awful', icon: <Angry className="w-6 h-6 text-red-500" /> },
  { value: 2, label: 'Bad', icon: <Frown className="w-6 h-6 text-orange-500" /> },
  { value: 3, label: 'Okay', icon: <Meh className="w-6 h-6 text-yellow-500" /> },
  { value: 4, label: 'Good', icon: <Smile className="w-6 h-6 text-lime-500" /> },
  { value: 5, label: 'Great', icon: <Laugh className="w-6 h-6 text-green-500" /> },
];

export default function MoodPage() {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([
    // Sample initial data - replace with actual data fetching
    { id: 'm1', moodRating: 4, timestamp: subDays(new Date(), 1) },
    { id: 'm2', moodRating: 3, timestamp: subDays(new Date(), 2) },
    { id: 'm3', moodRating: 5, timestamp: subDays(new Date(), 3) },
    { id: 'm4', moodRating: 2, timestamp: subDays(new Date(), 4) },
    { id: 'm5', moodRating: 4, timestamp: subDays(new Date(), 5) },
    { id: 'm6', moodRating: 3, timestamp: subDays(new Date(), 6) },
    { id: 'm7', moodRating: 5, timestamp: subDays(new Date(), 7) },
    { id: 'm8', moodRating: 4, timestamp: subDays(new Date(), 10) },
    { id: 'm9', moodRating: 2, timestamp: subDays(new Date(), 15) },
    { id: 'm10', moodRating: 5, timestamp: subDays(new Date(), 20) },
    { id: 'm11', moodRating: 3, timestamp: subDays(new Date(), 25) },
    { id: 'm12', moodRating: 4, timestamp: subDays(new Date(), 30) },
  ]);
  const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<string>("7"); // Default to 7 days

  const handleLogMood = () => {
    if (!selectedMood) return;
    const newLog: MoodLog = {
      id: Date.now().toString(), // Temporary ID
      moodRating: parseInt(selectedMood, 10),
      timestamp: new Date(),
    };
    // Add logic to check if a mood was already logged today and potentially update it
    setMoodLogs([newLog, ...moodLogs]);
    console.log('Logged mood:', newLog);
    setSelectedMood(undefined); // Reset selection
  };

  const filteredMoodData = useMemo(() => {
    const days = parseInt(timeRange, 10);
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, days - 1));

    // Filter logs within the selected date range
    const logsInRange = moodLogs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);

    // Aggregate moods per day (e.g., average if multiple logs per day, or just the latest)
    // For simplicity, we'll assume one log per day max or take the latest for the chart
    const dailyDataMap = new Map<string, number>();
    logsInRange.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort oldest to newest

    logsInRange.forEach(log => {
      const dayKey = format(log.timestamp, 'yyyy-MM-dd');
      dailyDataMap.set(dayKey, log.moodRating); // Overwrite with the latest log for that day if multiple exist
    });

    // Create data points for the chart for the last 'days' days
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = startOfDay(subDays(endDate, i));
      const dateKey = format(date, 'yyyy-MM-dd');
      chartData.push({
        date: format(date, 'MMM d'), // Format for X-axis label
        mood: dailyDataMap.get(dateKey) ?? null, // Use null if no data for that day
      });
    }

    return chartData.reverse(); // Reverse to show oldest to newest on the chart

  }, [moodLogs, timeRange]);

  const chartConfig = {
    mood: {
      label: "Mood Rating",
      color: "hsl(var(--primary))", // Use primary color
    },
  } satisfies ChartConfig;

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
      if (active && payload && payload.length && payload[0].value !== null) {
        const rating = payload[0].value;
        const moodInfo = moodOptions.find(opt => opt.value === rating);
        return (
          <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
              <div className="font-medium">{label}</div>
               {moodInfo && (
                 <>
                  <div className="flex items-center gap-1 justify-end">
                    {React.cloneElement(moodInfo.icon, { className: "w-4 h-4" })}
                    <span>{moodInfo.label} ({rating}/5)</span>
                  </div>
                 </>
                )}
                {moodInfo === undefined && (
                    <div className="text-muted-foreground text-xs justify-end">
                     No data logged
                    </div>
                )}

            </div>
          </div>
        );
      }
      // Show tooltip even if no data, indicating the date
       if (active) {
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
               <div className="font-medium">{label}</div>
               <div className="text-muted-foreground text-xs">No data</div>
            </div>
          );
       }


      return null;
  };


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
          >
            {moodOptions.map((option) => (
              <div key={option.value} className="flex flex-col items-center space-y-2">
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`mood-${option.value}`}
                  className="sr-only" // Hide the default radio button visually
                  aria-label={option.label}
                />
                <Label
                  htmlFor={`mood-${option.value}`}
                  className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 w-24 h-24
                  ${selectedMood === option.value.toString() ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-border hover:border-accent hover:bg-accent/10'}`}
                >
                  {option.icon}
                  <span className="mt-2 text-sm font-medium text-center">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-center mt-6">
            <Button onClick={handleLogMood} disabled={!selectedMood}>
              Log Today's Mood
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mood History Chart Section */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div>
             <CardTitle>Mood History</CardTitle>
             <CardDescription>Your mood ratings over the selected period.</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              {/* Add more options if needed */}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredMoodData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={filteredMoodData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }} // Adjusted left margin
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 6)} // Shorten date label if needed
                />
                 <YAxis
                  domain={[0, 5]} // Set Y-axis domain from 0 to 5
                  allowDecimals={false} // No decimals for mood rating
                  tickCount={6} // Show ticks for 0, 1, 2, 3, 4, 5
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                 />
                 <ChartTooltip
                    cursor={false}
                    content={<CustomTooltip />}
                  />
                <Bar dataKey="mood" fill="var(--color-mood)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
             <div className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground">No mood data available for this period.</p>
              </div>
          )}
        </CardContent>
      </Card>

       {/* Optionally, display a list of recent logs */}
       {/* <Card className="mt-8">
           <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
           </CardHeader>
           <CardContent>
              <ScrollArea className="h-[200px]">
                 {moodLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex justify-between items-center p-2 border-b">
                       <span>{moodOptions.find(o => o.value === log.moodRating)?.label} ({log.moodRating}/5)</span>
                       <span className="text-sm text-muted-foreground">{format(log.timestamp, 'Pp')}</span>
                    </div>
                 ))}
              </ScrollArea>
           </CardContent>
       </Card> */}
    </div>
  );
}
