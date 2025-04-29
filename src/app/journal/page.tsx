// src/app/journal/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, BookOpenText, Edit, Trash2, Loader2 } from 'lucide-react'; // Added Edit, Trash2, Loader2
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, isAuthenticated, logout } from '@/lib/auth'; // Import auth functions
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog
import { useRouter } from 'next/navigation';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> // Show skeleton while loading editor
});

// Data structure matching backend serializer
interface JournalEntry {
  id: number; // Changed to number to match typical DB IDs
  content: string;
  created_at: string; // Keep as string from API, format on display
  updated_at: string;
  user?: number; // Optional user ID from backend
  user_email?: string; // Optional user email from backend
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false); // Combined state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch
  const [isSaving, setIsSaving] = useState(false); // Saving state for create/update
  const [isDeleting, setIsDeleting] = useState<number | null>(null); // Track which entry is being deleted
  const { toast } = useToast();
  const router = useRouter();

  // --- Check Authentication ---
  useEffect(() => {
    if (!isAuthenticated()) {
        toast({ title: "Unauthorized", description: "Please log in to access your journal.", variant: "destructive" });
        router.push('/login');
    }
  }, [router, toast]);


  // --- Fetch Entries ---
  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated()) return; // Don't fetch if not logged in

    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/journal/`);
      if (!response.ok) {
        if (response.status === 401) {
           // fetchWithAuth should handle refresh/redirect, but add a fallback
           toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
           router.push('/login');
           return;
        }
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      const data = await response.json();
      // Assuming the API returns a list directly or under a 'results' key for pagination
      setEntries(data.results || data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      toast({ title: "Error", description: error.message || "Could not load journal entries.", variant: "destructive" });
       if (error.message.includes('Session expired')) {
          // Already handled by fetchWithAuth redirect usually
       }
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]); // Add router to dependencies

  // Fetch entries on component mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // --- Handlers ---
  const handleCreateNew = () => {
    setIsCreatingOrEditing(true);
    setEditingEntry(null);
    setNewEntryContent('');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntryContent(entry.content);
    setIsCreatingOrEditing(true);
     window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to editor
  };

  const handleCancelEdit = () => {
    setIsCreatingOrEditing(false);
    setEditingEntry(null);
    setNewEntryContent('');
  };

  const handleSaveEntry = async () => {
    if (!newEntryContent.trim() || newEntryContent === '<p><br></p>') {
      toast({ title: "Cannot Save", description: "Entry content cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const url = editingEntry
      ? `${API_BASE_URL}/api/journal/${editingEntry.id}/`
      : `${API_BASE_URL}/api/journal/`;
    const method = editingEntry ? 'PUT' : 'POST';

    try {
      const response = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify({ content: newEntryContent }),
        // fetchWithAuth handles Content-Type and Authorization headers
      });

      const savedEntry = await response.json();

      if (!response.ok) {
        // Handle specific API errors if provided
        const errorMsg = savedEntry.detail || savedEntry.content?.[0] || `Failed to ${editingEntry ? 'update' : 'save'} entry.`;
        throw new Error(errorMsg);
      }


      if (editingEntry) {
        // Update in local state
        setEntries(entries.map(e => e.id === savedEntry.id ? savedEntry : e));
        toast({ title: "Success", description: "Journal entry updated." });
      } else {
        // Add to local state (at the beginning)
        setEntries([savedEntry, ...entries]);
        toast({ title: "Success", description: "Journal entry saved." });
      }
      handleCancelEdit(); // Close editor and reset state

    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({ title: "Error", description: error.message || `Could not ${editingEntry ? 'update' : 'save'} entry.`, variant: "destructive" });
        if (error.message.includes('Session expired')) {
             // fetchWithAuth handles redirect
        }
    } finally {
      setIsSaving(false);
    }
  };

   const handleDeleteEntry = async (id: number) => {
     setIsDeleting(id); // Set deleting state for specific entry
     try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/journal/${id}/`, {
            method: 'DELETE',
            // fetchWithAuth handles Authorization header
        });

        if (!response.ok) {
             if (response.status === 204) { // No Content success
                 // Proceed normally
             } else {
                const errorData = await response.text(); // Try getting text if JSON fails
                 throw new Error(`Failed to delete entry: ${response.statusText} ${errorData}`);
             }
        }

        // Remove from local state on successful deletion (status 204)
        setEntries(entries.filter(e => e.id !== id));
        toast({ title: "Success", description: "Journal entry deleted." });

        if (editingEntry?.id === id) {
            handleCancelEdit(); // Cancel edit if deleting the entry being edited
        }

     } catch (error: any) {
        console.error('Error deleting entry:', error);
        toast({ title: "Error", description: error.message || "Could not delete entry.", variant: "destructive" });
         if (error.message.includes('Session expired')) {
             // fetchWithAuth handles redirect
         }
     } finally {
        setIsDeleting(null); // Reset deleting state
     }
   };


  // --- Quill Configuration ---
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  // --- Render Logic ---

   const renderEntries = () => {
    if (isLoading) {
      return <EntryListSkeleton />; // Show skeleton loader
    }
    if (entries.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No journal entries yet. Click "New Entry" to start writing!</p>;
    }
    return (
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="border p-4 rounded-lg bg-card hover:shadow-md transition-shadow duration-200 relative group">
               {/* Ensure content is sanitized if coming directly from user input, though Quill generally handles this */}
              <div className="prose prose-sm max-w-none text-card-foreground" dangerouslySetInnerHTML={{ __html: entry.content }} />
              <p className="text-xs text-muted-foreground mt-3">
                Created: {format(new Date(entry.created_at), 'PPP p')}
                {entry.created_at !== entry.updated_at && ` | Updated: ${format(new Date(entry.updated_at), 'PPP p')}`}
              </p>
               {/* Action Buttons */}
               <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditEntry(entry)} disabled={isCreatingOrEditing || isDeleting === entry.id}>
                      <Edit className="w-4 h-4"/>
                      <span className="sr-only">Edit</span>
                   </Button>
                    {/* Delete Confirmation */}
                   <AlertDialog>
                       <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" disabled={isCreatingOrEditing || isDeleting === entry.id}>
                                {isDeleting === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4"/>}
                               <span className="sr-only">Delete</span>
                            </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                           <AlertDialogHeader>
                           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                           <AlertDialogDescription>
                               This action cannot be undone. This will permanently delete your journal entry.
                           </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                           </AlertDialogAction>
                           </AlertDialogFooter>
                       </AlertDialogContent>
                   </AlertDialog>
               </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center gap-2">
           <BookOpenText className="w-8 h-8" /> Your Journal
        </h1>
        {!isCreatingOrEditing && (
          <Button onClick={handleCreateNew} disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Entry
          </Button>
        )}
      </header>

      {isCreatingOrEditing && (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>{editingEntry ? 'Edit Entry' : 'New Journal Entry'}</CardTitle>
            {editingEntry && (
              <CardDescription>
                Last updated: {format(new Date(editingEntry.updated_at), 'PPP p')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
             {typeof window !== 'undefined' && ( // Ensure ReactQuill renders only client-side
                <ReactQuill
                theme="snow"
                value={newEntryContent}
                onChange={setNewEntryContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your thoughts here..."
                className="bg-card mb-4" // Add margin bottom
                />
             )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveEntry} disabled={isSaving || !newEntryContent.trim() || newEntryContent === '<p><br></p>'}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSaving ? (editingEntry ? 'Updating...' : 'Saving...') : (editingEntry ? 'Update Entry' : 'Save Entry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Past Entries</CardTitle>
             <CardDescription>Your reflections, chronologically.</CardDescription>
          </CardHeader>
          <CardContent>
             {renderEntries()}
          </CardContent>
        </Card>

         {/* Logout Button Example */}
         <div className="mt-8 text-center">
             <Button variant="outline" onClick={logout}>Logout</Button>
         </div>
    </div>
  );
}


// Skeleton Loader for Entry List
function EntryListSkeleton() {
  return (
    <div className="space-y-6 pr-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border p-4 rounded-lg bg-card">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}
