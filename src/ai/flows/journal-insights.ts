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
            // Placeholder for sentiment analysis - replace with actual call if needed
            // For now, we'll just simulate based on simple keyword matching or length
            // In a real scenario, you might use the LLM or a dedicated sentiment library here
             const sentiment = await analyzeSentiment(entry.content);
             if (sentiment.label === 'positive' && sentiment.score > 0.5) { // Example threshold
                 positiveKeywords.push(entry.content.substring(0, 50)); // Push truncated content as keyword/theme
             } else if (sentiment.label === 'negative' && sentiment.score > 0.5) {
                 negativeKeywords.push(entry.content.substring(0, 50));
             }
        }

        // Basic keyword extraction simulation (replace with actual NLP if needed)
         input.entries.forEach(entry => {
             if (entry.content.toLowerCase().includes('happy') || entry.content.toLowerCase().includes('great')) {
                 positiveKeywords.push('Happiness indicators');
             }
              if (entry.content.toLowerCase().includes('sad') || entry.content.toLowerCase().includes('anxious')) {
                 negativeKeywords.push('Stress/Sadness indicators');
             }
         });

        // Deduplicate and limit keywords
        const uniquePositive = [...new Set(positiveKeywords)].slice(0, 5);
        const uniqueNegative = [...new Set(negativeKeywords)].slice(0, 5);


        return {
             positiveKeywords: uniquePositive,
             negativeKeywords: uniqueNegative
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
      positiveKeywords: z.array(z.string()).describe('Keywords associated with positive sentiment.'),
      negativeKeywords: z.array(z.string()).describe('Keywords associated with negative sentiment.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A 2-3 sentence summary of key emotional themes and trends observed in the journal entries and mood logs. Mention any correlation or divergence between entries and mood ratings.'),
      dominantMood: z.string().describe('The dominant mood observed from the mood logs (e.g., Mostly Positive, Mixed, Mostly Negative, Neutral). Calculate this based on average or mode of mood ratings.'),
    }),
  },
   prompt: `You are an AI assistant helping users reflect on their mental well-being. Analyze the provided journal entries, mood logs, and keywords to identify emotional patterns and trends.

Journal Entries (recent first):
{{#each journalEntries}}
- {{this.createdAt}}: {{this.content}}
{{else}}
- No journal entries provided.
{{/each}}

Mood Logs (recent first):
{{#each moodLogs}}
- {{this.timestamp}}: Rating {{this.moodRating}}/5
{{else}}
- No mood logs provided.
{{/each}}

Identified Positive Themes/Keywords: {{#if positiveKeywords}}{{join positiveKeywords ", "}}{{else}}None{{/if}}
Identified Negative Themes/Keywords: {{#if negativeKeywords}}{{join negativeKeywords ", "}}{{else}}None{{/if}}

Instructions:
1.  **Summarize Emotional Themes:** Based *only* on the provided journal entries and keywords, write a brief (2-3 sentences) summary identifying the main emotional themes or recurring topics. Are the themes generally positive, negative, or mixed?
2.  **Determine Dominant Mood:** Based *only* on the mood log ratings provided (1-5 scale: 1=Awful, 5=Great), determine the overall dominant mood for the period. Categorize it as 'Mostly Positive' (average > 3.5), 'Mostly Negative' (average < 2.5), 'Neutral' (average between 2.5 and 3.5), or 'Mixed' if there's significant fluctuation. If no logs, state 'Not enough mood data'.
3.  **Output:** Provide the summary and the dominant mood in the specified JSON format. Be concise and base your analysis strictly on the data given.`,
  tools: [analyzeJournalEntries] // Make the tool available
});

const journalInsightsFlow = ai.defineFlow<
  typeof JournalInsightsInputSchema,
  typeof JournalInsightsOutputSchema
>({
  name: 'journalInsightsFlow',
  inputSchema: JournalInsightsInputSchema,
  outputSchema: JournalInsightsOutputSchema,
}, async (input) => {
    // Call the tool first to get keywords
    const { positiveKeywords, negativeKeywords } = await analyzeJournalEntries({
        entries: input.journalEntries
    });

    // Call the prompt with the original input and the results from the tool
    const { output } = await journalInsightsPrompt({
        ...input,
        positiveKeywords,
        negativeKeywords
    });

    if (!output) {
        throw new Error("AI failed to generate insights.");
    }

    // Combine the prompt output with the keywords from the tool for the final result
    return {
        summary: output.summary,
        dominantMood: output.dominantMood,
        positiveKeywords, // Use keywords returned by the tool
        negativeKeywords // Use keywords returned by the tool
    };
});
