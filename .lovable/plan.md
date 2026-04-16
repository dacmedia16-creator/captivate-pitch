

# Fix: AI Extraction Timeout in Inngest

## Problem
The AI extraction step (`ai-extract-batch-0`) sends 5 full-page markdowns to Gemini in a single API call. The combined payload is too large (92 valid pages, 20 sent to AI), and even the first batch of 5 pages causes the edge function to timeout before the AI response returns. Logs show repeated "Starting analysis → FASE 3 → Extraindo de 5 páginas → shutdown" cycle.

## Root Cause
Each scraped page's markdown can be 10-50KB. A batch of 5 pages could be 50-250KB of text sent to Gemini, which takes >60s to process — exceeding the edge function timeout.

## Solution
Reduce batch size and truncate markdown content to fit within the timeout window.

### Changes in `supabase/functions/inngest-serve/index.ts`

1. **Reduce AI batch size from 5 to 2 pages** — Smaller batches complete faster, and Inngest caches completed steps so progress is preserved across invocations.
   - Line ~820: `AI_BATCH_SIZE = 5` → `AI_BATCH_SIZE = 2`

2. **Truncate page markdown to 8,000 chars** — Most listing data is in the first ~5KB. Long descriptions, footer content, and related listings add bulk without value.
   - In the `extractWithAI` function (line ~507), when building `combined`, truncate each `p.markdown` to 8,000 chars.
   - Also apply the same truncation in the batched extraction loop at line ~837.

3. **Reduce MAX_AI_PAGES from 20 to 15** — With pre-extracted pages already captured separately, 15 AI pages is sufficient for a good sample.
   - Line ~821: `MAX_AI_PAGES = 20` → `MAX_AI_PAGES = 15`

### Impact
- Each `step.run("ai-extract-batch-N")` now processes 2 pages (~16KB) instead of 5 pages (~50-250KB)
- AI response time drops from ~60-120s to ~15-30s per batch
- More batches (8 instead of 4), but each survives the timeout
- Inngest caches completed batches, so retries skip finished ones
- No schema or frontend changes

