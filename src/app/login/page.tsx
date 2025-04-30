// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Use App Router's router

// Define the form schema using Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Define expected API response structure (adjust based on dj-rest-auth)
interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
        pk: number;
        username: string; // Or id if you don't use username
        email: string;
        // Add other user fields if returned by your CurrentUserSerializer
    };
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // Use environment variable

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    console.log('Attempting login with:', data.email);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, { // Use dj-rest-auth login endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: data.email, // dj-rest-auth typically uses email
            password: data.password
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Login failed response:', responseData);
        // Extract specific error message if available (dj-rest-auth might return non_field_errors)
        const errorMessage = responseData.non_field_errors?.[0] || responseData.detail || 'Invalid email or password.';
        throw new Error(errorMessage);
      }

      // Assuming dj-rest-auth with JWT returns access/refresh tokens directly or in cookies
      console.log('Login successful response:', responseData);

      // --- Handle Tokens ---
      // Option 1: Tokens in response body (dj-rest-auth default with USE_JWT=True and no cookies)
      if (responseData.access && responseData.refresh) { // CORRECTED KEYS
        localStorage.setItem('accessToken', responseData.access); // CORRECTED KEY
        localStorage.setItem('refreshToken', responseData.refresh); // CORRECTED KEY
        console.log("Tokens stored in localStorage"); // This should now be logged
    }
    // Option 2: Tokens in HttpOnly Cookies (...)
    else {
        // This block should NOT be executed if tokens are in the response body
        console.log("Assuming tokens are set in HttpOnly cookies by the backend.");
        // Check your Django settings: JWT_AUTH_HTTPONLY=True, JWT_AUTH_COOKIE, JWT_AUTH_REFRESH_COOKIE
    }

      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/'); // Redirect to dashboard/home page after successful login

    } catch (error: any) {
      console.error("Login error catch block:", error);
      toast({
          title: "Login Failed",
          description: error.message || "An unexpected error occurred.", // Use error message from throw
          variant: "destructive"
      });
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 text-primary">
            <LogIn className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Log in to continue your mindful journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Log In'}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/register">
                Sign up
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
