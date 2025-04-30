'use client';
import { Label } from '@/components/ui/label';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Music, VolumeX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast'; // Assuming useToast hook exists

export default function MeditationPage() {
  const defaultDuration = 5 * 60; // Default 5 minutes in seconds
  const [duration, setDuration] = useState<number>(defaultDuration); // Duration in seconds
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showSoundOptions, setShowSoundOptions] = useState<boolean>(false); // Toggle for sound options
  const [startSoundEnabled, setStartSoundEnabled] = useState<boolean>(false);
  const [endSoundEnabled, setEndSoundEnabled] = useState<boolean>(true); // End sound often desired

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast(); // Initialize toast hook

  // Load audio files on component mount (client-side only)
   useEffect(() => {
      startAudioRef.current = new Audio('/sounds/bell-start.mp3'); // Replace with actual path
      endAudioRef.current = new Audio('/sounds/bell-end.mp3'); // Replace with actual path
      startAudioRef.current.load();
      endAudioRef.current.load();
   }, []);


  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
       // Play end sound if enabled
       if (endSoundEnabled && endAudioRef.current) {
         endAudioRef.current.play().catch(error => console.error("Error playing end sound:", error));
       }
      toast({
        title: "Meditation Complete",
        description: "You've completed your session. Well done!",
        variant: "default", // Or a custom success variant
      });
      // Reset timer automatically after completion? Optional.
      // setTimeLeft(duration);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, endSoundEnabled, toast]); // Added endSoundEnabled and toast

  const handleDurationChange = (value: string) => {
    const newDuration = parseInt(value, 10) * 60;
    setDuration(newDuration);
    if (!isRunning) { // Only reset timeLeft if timer isn't running
      setTimeLeft(newDuration);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && timeLeft === duration && startSoundEnabled && startAudioRef.current) {
       // Play start sound only when starting from the beginning
       startAudioRef.current.play().catch(error => console.error("Error playing start sound:", error));
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setTimeLeft(duration);
  };

  // Format time left as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressValue = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-accent">
            <TimerIcon className="w-12 h-12" />
          </div>
          <CardTitle className="text-3xl font-bold">Meditation Timer</CardTitle>
          <CardDescription>Take a moment to breathe and center yourself.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          {/* Duration Selection */}
           <div className="w-full flex flex-col items-center space-y-2">
              <Label htmlFor="duration-select" className="text-sm font-medium text-muted-foreground">Select Duration</Label>
              <Select
                value={(duration / 60).toString()}
                onValueChange={handleDurationChange}
                disabled={isRunning}
              >
                <SelectTrigger id="duration-select" className="w-[180px]">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Minute</SelectItem>
                  <SelectItem value="3">3 Minutes</SelectItem>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes</SelectItem>
                  <SelectItem value="15">15 Minutes</SelectItem>
                  <SelectItem value="20">20 Minutes</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                </SelectContent>
              </Select>
           </div>

          {/* Timer Display */}
          <div className="text-7xl font-mono font-semibold text-primary tabular-nums">
            {formatTime(timeLeft)}
          </div>

          {/* Progress Bar */}
          <Progress value={progressValue} className="w-full h-2" />


          {/* Timer Controls */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              aria-label="Reset Timer"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={toggleTimer}
              aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
              className="w-24" // Give start/pause button more width
            >
              {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              <span className="ml-2">{isRunning ? 'Pause' : 'Start'}</span>
            </Button>
             {/* Sound Toggle Button */}
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSoundOptions(!showSoundOptions)}
                aria-label="Sound Options"
                className={showSoundOptions ? "bg-accent/20" : ""}
              >
               <Music className="h-5 w-5" />
            </Button>
          </div>

           {/* Sound Options (Conditional) */}
           {showSoundOptions && (
            <div className="w-full pt-4 border-t mt-4 text-sm text-muted-foreground space-y-3 text-center">
               <p className="font-medium text-foreground mb-2">Sound Preferences</p>
              <div className="flex items-center justify-center space-x-4">
                  <Label htmlFor="start-sound" className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" id="start-sound" checked={startSoundEnabled} onChange={(e) => setStartSoundEnabled(e.target.checked)} className="accent-primary"/>
                      Start Bell
                  </Label>
                   <Label htmlFor="end-sound" className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="end-sound" checked={endSoundEnabled} onChange={(e) => setEndSoundEnabled(e.target.checked)} className="accent-primary"/>
                      End Bell
                   </Label>
              </div>
              <p className="text-xs mt-2 italic">(Ensure your device volume is on)</p>
            </div>
           )}

        </CardContent>
      </Card>

      {/* Audio elements - hidden */}
       {/* <audio ref={startAudioRef} src="/sounds/bell-start.mp3" preload="auto"></audio>
       <audio ref={endAudioRef} src="/sounds/bell-end.mp3" preload="auto"></audio> */}
    </div>
  );
}
