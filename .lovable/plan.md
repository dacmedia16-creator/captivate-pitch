

# Fix: AI Extraction Timeout Causing 0 Comparables

## Root Cause
The `ai-extraction` Inngest step sends up to 20 pages of markdown to Gemini in a **single API call**. For Casa Alphaville, this call exceeded the edge function timeout (~150s), causing the function to be killed. On retry, the step returned empty results.

## Solution

### 1. Split AI extraction into smaller batches (inngest-serve)
Instead of one monolithic AI call with 20 pages, split into batches of **5 pages** each as separate `step.run()` calls. This way:
- Each batch completes within timeout
- Inngest memoizes completed batches
- Partial results survive retries

### 2. Add logging for AI extraction results
Log how many comparables the AI returned vs how many passed scoring, so we can distinguish "AI returned nothing" from "scoring filtered everything".

### 3. Add fallback: retry with smaller batch on failure
If a batch AI call fails, retry with 2-3 pages instead of 5.

## Files

| File | Change |
|------|--------|
| `supabase/functions/inngest-serve/index.ts` | Split `ai-extraction` into batched `step.run()` calls of 5 pages each; add diagnostic logging before/after scoring |

## Technical Detail

```
// Before (single step):
const rawComparables = await step.run("ai-extraction", async () => {
  return await extractWithAI(allPages, property, LOVABLE_API_KEY!);
});

// After (batched steps):
const AI_BATCH = 5;
const rawComparables: any[] = [];
for (let i = 0; i < allPages.length; i += AI_BATCH) {
  const batch = allPages.slice(i, i + AI_BATCH);
  const batchResult = await step.run(`ai-extract-${i}`, async () => {
    return await extractWithAI(batch, property, LOVABLE_API_KEY!);
  });
  rawComparables.push(...batchResult);
}
```

This ensures each AI call processes ~5 pages (~30s) instead of 20 pages (~120s+), staying well within edge function limits and surviving retries gracefully.

