'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, BookOpenText } from 'lucide-react';
import dynamic from 'next/dynamic'; // Import dynamic for client-side rendering of ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

// Dynamically import ReactQuill to ensure it only runs on the client
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Sample data structure for journal entries
interface JournalEntry {
  id: string;
  content: string; // HTML content from ReactQuill
  createdAt: Date;
  updatedAt: Date;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    // Sample initial data - replace with actual data fetching
    { id: '1', content: '<p>Feeling optimistic today. Had a good meeting.</p>', createdAt: new Date(2024, 6, 15, 10, 30), updatedAt: new Date(2024, 6, 15, 10, 30) },
    { id: '2', content: '<p>A bit stressed about the deadline, but managed to make progress.</p><ul><li>Finished report draft.</li><li>Planned next steps.</li></ul>', createdAt: new Date(2024, 6, 14, 16, 0), updatedAt: new Date(2024, 6, 14, 16, 0) },
  ]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingEntry(null); // Ensure not editing when creating
    setNewEntryContent(''); // Clear content for new entry
  };

  const handleSaveEntry = () => {
    if (editingEntry) {
      // Update existing entry (replace with API call)
      setEntries(entries.map(e => e.id === editingEntry.id ? { ...e, content: newEntryContent, updatedAt: new Date() } : e));
      console.log('Updating entry:', editingEntry.id, newEntryContent);
    } else {
      // Create new entry (replace with API call)
      const newEntry: JournalEntry = {
        id: Date.now().toString(), // Temporary ID generation
        content: newEntryContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setEntries([newEntry, ...entries]); // Add to the beginning
      console.log('Creating new entry:', newEntry);
    }
    setIsCreating(false);
    setEditingEntry(null);
    setNewEntryContent('');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntryContent(entry.content);
    setIsCreating(true); // Reuse the editor section
  };

   const handleDeleteEntry = (id: string) => {
    // Add confirmation dialog here in a real app
    setEntries(entries.filter(e => e.id !== id));
    console.log('Deleting entry:', id);
     if (editingEntry?.id === id) {
       handleCancelEdit(); // Cancel edit if deleting the entry being edited
     }
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingEntry(null);
    setNewEntryContent('');
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'], // Added link capability
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link' // Added link format
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4 md:mb-0 flex items-center gap-2">
           <BookOpenText className="w-8 h-8" /> Your Journal
        </h1>
        {!isCreating && (
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Entry
          </Button>
        )}
      </header>

      {isCreating ? (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>{editingEntry ? 'Edit Entry' : 'New Journal Entry'}</CardTitle>
            {editingEntry && (
              <CardDescription>
                Last updated: {format(editingEntry.updatedAt, 'PPP p')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ReactQuill
              theme="snow"
              value={newEntryContent}
              onChange={setNewEntryContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write your thoughts here..."
              className="bg-card"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveEntry} disabled={!newEntryContent.trim() || newEntryContent === '<p><br></p>'}>
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Past Entries</CardTitle>
             <CardDescription>Your reflections, chronologically.</CardDescription>
          </CardHeader>
          <CardContent>
             {entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No journal entries yet. Start by creating one!</p>
             ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {entries.map((entry) => (
                  <div key={entry.id} className="border p-4 rounded-lg bg-background hover:bg-muted/50 transition-colors duration-200 relative group">
                    <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: entry.content }} />
                    <p className="text-xs text-muted-foreground mt-3">
                      Created: {format(entry.createdAt, 'PPP p')}
                      {entry.createdAt.getTime() !== entry.updatedAt.getTime() && ` | Updated: ${format(entry.updatedAt, 'PPP p')}`}
                    </p>
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditEntry(entry)}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                           <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleDeleteEntry(entry.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                           <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
