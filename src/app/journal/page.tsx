// src/app/journal/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, BookOpenText, Edit, Trash2, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, isAuthenticated, logout } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full rounded-md" />
});

// Data structure matching backend serializer
interface JournalEntry {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: number;
  user_email?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

// Skeleton Loader for the whole page during auth check
function PageLoadingSkeleton() {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 animate-pulse">
         <header className="flex flex-col md:flex-row justify-between items-center mb-8">
           <Skeleton className="h-10 w-64 mb-4 md:mb-0" />
           <Skeleton className="h-10 w-32" />
         </header>
         <Card className="shadow-lg">
           <CardHeader>
             <Skeleton className="h-6 w-40 mb-2" />
             <Skeleton className="h-4 w-60" />
           </CardHeader>
           <CardContent>
             <EntryListSkeleton />
           </CardContent>
         </Card>
      </div>
    );
}


export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true); // Renamed for clarity
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // --- NEW: State for Authentication Check ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  // --- Check Authentication ---
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({ title: "Unauthorized", description: "Please log in to access your journal.", variant: "destructive" });
      router.push('/login');
      // No need to set checking/authorized state if redirecting
    } else {
      // User is authenticated, allow component to render
      setIsAuthorized(true);
      setIsCheckingAuth(false);
    }
    // Removed dependency array warning: we only want this to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Fetch Entries ---
  const fetchEntries = useCallback(async () => {
    // No need to check isAuthenticated() here again, handled by the effect above
    // We also only fetch if authorized state becomes true

    setIsLoadingEntries(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/journal/`);
      if (!response.ok) {
        // fetchWithAuth handles 401 redirect automatically
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      const data = await response.json();
      setEntries(data.results || data || []);
    } catch (error: any) {
      console.error('Error fetching journal entries:', error);
      // Avoid duplicate toast if auth error was already handled by fetchWithAuth redirect
      if (!error.message?.includes('Session expired')) {
          toast({ title: "Error", description: error.message || "Could not load journal entries.", variant: "destructive" });
      }
    } finally {
      setIsLoadingEntries(false);
    }
  }, [toast]); // Removed router dependency, handled in auth check effect

  // Fetch entries only after authorization is confirmed
  useEffect(() => {
    if (isAuthorized) {
      fetchEntries();
    }
  }, [isAuthorized, fetchEntries]); // Run when isAuthorized becomes true

  // --- Handlers (handleCreateNew, handleEditEntry, handleCancelEdit, handleSaveEntry, handleDeleteEntry) ---
  // No changes needed in these handlers for the auth check logic

  const handleCreateNew = () => {
    setIsCreatingOrEditing(true);
    setEditingEntry(null);
    setNewEntryTitle(''); // Reset title state
    setNewEntryContent('');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntryTitle(entry.title); // Set title state from entry
    setNewEntryContent(entry.content);
    setIsCreatingOrEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsCreatingOrEditing(false);
    setEditingEntry(null);
    setNewEntryTitle('');
    setNewEntryContent('');
  };

  const handleSaveEntry = async () => {
    // Keep validation primarily for content, title can use default or be empty if desired
    if (!newEntryContent.trim() || newEntryContent === '<p><br></p>') {
      toast({ title: "Cannot Save", description: "Entry content cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const url = editingEntry
      ? `${API_BASE_URL}/api/journal/${editingEntry.id}/`
      : `${API_BASE_URL}/api/journal/`;
    const method = editingEntry ? 'PUT' : 'POST';

    // --- Prepare data payload with title and content ---
    const bodyData = {
        title: newEntryTitle.trim() || "Untitled Entry", // Use title state, fallback to default if empty
        content: newEntryContent
    };

    try {
      const response = await fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(bodyData), // Send title and content
        // fetchWithAuth handles Content-Type and Authorization headers
      });

      // Try to parse JSON, but handle potential non-JSON error responses
      let savedEntry;
      try {
          savedEntry = await response.json();
      } catch (e) {
          // If response is not JSON (e.g., plain text error), use statusText
          if (!response.ok) {
              throw new Error(`Failed to ${editingEntry ? 'update' : 'save'} entry: ${response.status} ${response.statusText}`);
          }
          // If it was OK but not JSON (unlikely for DRF), rethrow original error
          throw e;
      }


      if (!response.ok) {
        // Handle specific API errors if provided in JSON response
        const errorMsg = savedEntry.detail || savedEntry.title?.[0] || savedEntry.content?.[0] || `Failed to ${editingEntry ? 'update' : 'save'} entry.`;
        throw new Error(errorMsg);
      }

      // --- Success Case ---
      if (editingEntry) {
        // Update in local state
        setEntries(entries.map(e => e.id === savedEntry.id ? savedEntry : e));
        toast({ title: "Success", description: "Journal entry updated." });
      } else {
        // Add to local state (at the beginning)
        setEntries([savedEntry, ...entries]);
        toast({ title: "Success", description: "Journal entry saved." });
      }
      handleCancelEdit(); // Close editor and reset state (this now also resets newEntryTitle)

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
    setIsDeleting(id);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/journal/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) { // Allow 204 No Content
        const errorData = await response.text();
        throw new Error(`Failed to delete entry: ${response.statusText} ${errorData}`);
      }

      setEntries(entries.filter(e => e.id !== id));
      toast({ title: "Success", description: "Journal entry deleted." });

      if (editingEntry?.id === id) {
        handleCancelEdit();
      }

    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({ title: "Error", description: error.message || "Could not delete entry.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
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
    if (isLoadingEntries) { // Use the renamed state
      return <EntryListSkeleton />;
    }
    if (entries.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No journal entries yet. Click "New Entry" to start writing!</p>;
    }
    return (
        // ... (rest of the renderEntries function is unchanged)
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="border p-4 rounded-lg bg-card hover:shadow-md transition-shadow duration-200 relative group">
              <h3 className="font-semibold text-lg mb-1">{entry.title}</h3> {/* Display title */}
              <p className="text-xs text-muted-foreground mt-2">
                Created: {format(new Date(entry.created_at), 'PPP p')}
                {entry.created_at !== entry.updated_at && ` | Updated: ${format(new Date(entry.updated_at), 'PPP p')}`}
              </p>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditEntry(entry)} disabled={isCreatingOrEditing || isDeleting === entry.id}>
                    <Edit className="w-4 h-4"/>
                    <span className="sr-only">Edit</span>
                  </Button>
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

  // --- Conditional Rendering based on Auth Check ---
  if (isCheckingAuth) {
    // Render a full page skeleton or loading indicator while checking auth
    return <PageLoadingSkeleton />;
  }

  if (!isAuthorized) {
    // Should have been redirected, but return null as a fallback
    return null;
  }

  // --- Render Authorized Content ---
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center gap-2">
          <BookOpenText className="w-8 h-8" /> Your Journal
        </h1>
        {!isCreatingOrEditing && (
          <Button onClick={handleCreateNew} disabled={isLoadingEntries}>
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
              <div className="space-y-2 mb-4"> {/* Add spacing below */}
                <Label htmlFor="entryTitle">Title</Label>
                <Input
                    id="entryTitle"
                    type="text"
                    placeholder="Enter a title for your entry (optional)"
                    value={newEntryTitle}
                    onChange={(e) => setNewEntryTitle(e.target.value)}
                    disabled={isSaving}
                    className="bg-background" // Match editor background potentially
                />
              </div>
             {typeof window !== 'undefined' && (
                <ReactQuill
                theme="snow"
                value={newEntryContent}
                onChange={setNewEntryContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your thoughts here..."
                className="bg-card mb-4"
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