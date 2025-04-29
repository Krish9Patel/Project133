// JournalInsights.ts
'use server';

/**
 * @fileOverview Provides AI-powered insights summarizing key emotional themes and trends from a user's journal entries and mood logs.
 *
 * - `getJournalInsights` - A function that retrieves journal insights for a given user.
 * - `JournalInsightsInput` - The input type for the `getJournalInsights` function.
 * - `JournalInsightsOutput` - The return type for the `getJournalInsights` function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { analyzeSentiment } from '@/services/sentiment-analysis';

const JournalInsightsInputSchema = z.object({
  journalEntries: z.array(
    z.object({
      content: z.string().describe('The text content of the journal entry.'),
      createdAt: z.string().describe('The creation timestamp of the journal entry (ISO format).'),
    })
  ).describe('An array of the user journal entries.'),
  moodLogs: z.array(
    z.object({
      moodRating: z.number().describe('The mood rating (e.g., 1-5).'),
      timestamp: z.string().describe('The timestamp of the mood log (ISO format).'),
    })
  ).describe('An array of the user mood logs.'),
});
export type JournalInsightsInput = z.infer<typeof JournalInsightsInputSchema>;

const JournalInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of key emotional themes and trends.'),
  dominantMood: z.string().describe('The dominant mood observed from the mood logs.'),
  positiveKeywords: z.array(z.string()).describe('Keywords associated with positive sentiment.'),
  negativeKeywords: z.array(z.string()).describe('Keywords associated with negative sentiment.'),
});
export type JournalInsightsOutput = z.infer<typeof JournalInsightsOutputSchema>;

export async function getJournalInsights(input: JournalInsightsInput): Promise<JournalInsightsOutput> {
  return journalInsightsFlow(input);
}

const analyzeJournalEntries = ai.defineTool(
    {
        name: 'analyzeJournalEntries',
        description: 'Analyzes journal entries to extract sentiment and keywords.',
        inputSchema: z.object({
            entries: z.array(z.object({
                content: z.string(),
                createdAt: z.string()
            })).describe('Array of journal entries')
        }),
        outputSchema: z.object({
            positiveKeywords: z.array(z.string()).describe('Keywords expressing positive sentiment'),
            negativeKeywords: z.array(z.string()).describe('Keywords expressing negative sentiment')
        })
    },
    async (input) => {
        const positiveKeywords: string[] = [];
        const negativeKeywords: string[] = [];

        for (const entry of input.entries) {
            const sentiment = await analyzeSentiment(entry.content);
            if (sentiment.label === 'positive') {
                positiveKeywords.push(entry.content);
            } else if (sentiment.label === 'negative') {
                negativeKeywords.push(entry.content);
            }
        }

        return {
            positiveKeywords,
            negativeKeywords
        };
    }
);

const journalInsightsPrompt = ai.definePrompt({
  name: 'journalInsightsPrompt',
  input: {
    schema: z.object({
      journalEntries: z.array(
        z.object({
          content: z.string().describe('The text content of the journal entry.'),
          createdAt: z.string().describe('The creation timestamp of the journal entry (ISO format).'),
        })
      ).describe('An array of the user journal entries.'),
      moodLogs: z.array(
        z.object({
          moodRating: z.number().describe('The mood rating (e.g., 1-5).'),
          timestamp: z.string().describe('The timestamp of the mood log (ISO format).'),
        })
      ).describe('An array of the user mood logs.'),
      positiveKeywords: z.array(z.string()).describe('Keywords associated with positive sentiment.'),n      negativeKeywords: z.array(z.string()).describe('Keywords associated with negative sentiment.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of key emotional themes and trends.'),
      dominantMood: z.string().describe('The dominant mood observed from the mood logs.'),
    }),
  },
  prompt: `Given the following journal entries, mood logs, positive keywords, and negative keywords, provide a summary of the key emotional themes and trends and identify the dominant mood.\n\nJournal Entries:\n{{#each journalEntries}}\n- Created at: {{this.createdAt}}, Content: {{this.content}}\n{{/each}}\n\nMood Logs:\n{{#each moodLogs}}\n- Timestamp: {{this.timestamp}}, Mood Rating: {{this.moodRating}}\n{{/each}}\n\nPositive Keywords: {{positiveKeywords}}\nNegative Keywords: {{negativeKeywords}}\n\nSummary:`, // Keep as one line.
  tools: [analyzeJournalEntries]
});

const journalInsightsFlow = ai.defineFlow<
  typeof JournalInsightsInputSchema,
  typeof JournalInsightsOutputSchema
>({
  name: 'journalInsightsFlow',
  inputSchema: JournalInsightsInputSchema,
  outputSchema: JournalInsightsOutputSchema,
}, async (input) => {
    const { positiveKeywords, negativeKeywords } = await analyzeJournalEntries({
        entries: input.journalEntries
    });

    const { output } = await journalInsightsPrompt({
        ...input,
        positiveKeywords,
        negativeKeywords
    });

  return {
    ...output!,
    positiveKeywords,
    negativeKeywords
  };
});
