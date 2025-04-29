'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Assuming hook exists

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

export default function RegisterPage() {
  const { toast } = useToast();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    console.log('Registration data:', data);
     // Exclude confirmPassword before sending to backend
    const { confirmPassword, ...submitData } = data;

    // --- TODO: Implement actual registration API call here ---
    // Example:
    // try {
    //   const response = await fetch('/api/auth/register', { // Your API endpoint
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(submitData),
    //   });
    //   if (!response.ok) {
    //      const errorData = await response.json();
    //      // Handle specific errors (e.g., email already exists)
    //      let errorMessage = 'Registration failed.';
    //      if (errorData.email) errorMessage = errorData.email[0];
    //      else if (errorData.password) errorMessage = errorData.password[0];
    //      else if (errorData.detail) errorMessage = errorData.detail;
    //      throw new Error(errorMessage);
    //   }
    //   // Handle successful registration (e.g., show message, redirect to login)
    //   toast({ title: "Registration Successful", description: "Please log in to continue." });
    //   // router.push('/login'); // Example redirect
    // } catch (error: any) {
    //   toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    // }


    // Simulate API call result
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Registration Successful", description: "Account created! Please log in." });
    // Redirect or update state here (e.g., router.push('/login'))
     form.reset();
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
                      <Input type="email" placeholder="you@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Account...' : 'Sign Up'}
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
