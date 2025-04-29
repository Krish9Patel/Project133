// src/app/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Use App Router's router

// Define the form schema using Zod
const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Set error on confirmPassword field
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    console.log('Attempting registration for:', data.email);
    // Exclude confirmPassword before sending to backend
    const submitData = {
        email: data.email,
        password: data.password,
        // dj-rest-auth registration endpoint also requires password confirmation
        password2: data.confirmPassword
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/registration/`, { // Use dj-rest-auth registration endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Registration failed response:', responseData);
        // Handle specific errors (e.g., email already exists)
        let errorMessage = 'Registration failed.';
        if (responseData.email) errorMessage = `Email: ${responseData.email[0]}`;
        else if (responseData.password) errorMessage = `Password: ${responseData.password[0]}`;
        else if (responseData.non_field_errors) errorMessage = responseData.non_field_errors[0];
        else if (responseData.detail) errorMessage = responseData.detail;
         // Check for password mismatch error specifically if backend sends it
        if (responseData.password2 && typeof responseData.password2 === 'string' && responseData.password2.includes("match")) {
            errorMessage = "Passwords don't match."; // More user-friendly message
             // Optionally set form error manually if needed, though Zod validation should catch it first
             form.setError("confirmPassword", { type: "manual", message: "Passwords don't match" });
        }
        throw new Error(errorMessage);
      }

      console.log('Registration successful response:', responseData); // Might contain user details or just a success message
      toast({ title: "Registration Successful", description: "Account created! Please log in." });
      router.push('/login'); // Redirect to login page after successful registration

    } catch (error: any) {
        console.error("Registration error catch block:", error);
        toast({
            title: "Registration Failed",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex justify-center items-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-primary">
            <UserPlus className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join Mindful Journey to start improving your well-being.</CardDescription>
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
                     <FormDescription className="text-xs">
                        Minimum 8 characters.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
           <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/login">
                Log in
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
