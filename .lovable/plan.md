

# Fix: Presentation Generation Screen Getting Stuck

## Problem
In `AgentNewPresentation.tsx`, the `handleGenerate` function runs the market analysis (deep scraping, comparables processing, AI summary) **sequentially before** setting `generationDone(true)`. The loading animation finishes in ~6 seconds, but the market analysis can take 2+ minutes, leaving the user stuck on "Finalizando..." indefinitely.

## Root Cause
Line 478 (`setGenerationDone(true)`) only executes after ALL market analysis completes — deep scraping, saving comparables, calculating adjustments, generating AI summary, etc.

## Solution
Restructure `handleGenerate` so that:
1. **Presentation creation + sections** run first (fast, ~2-3 seconds)
2. `setGenerationDone(true)` fires immediately after sections are generated
3. **Market analysis** runs in the background (fire-and-forget) — results are saved to DB but don't block the UI redirect

### Changes in `src/pages/agent/AgentNewPresentation.tsx`

Move the market analysis block to run as a **non-blocking background task** after `setGenerationDone(true)`:

```text
Current flow:
  1. Create presentation record
  2. Upload photos
  3. Run market analysis (2+ minutes)     ← BLOCKS
  4. Generate presentation sections
  5. Update pricing sections
  6. setGenerationDone(true)              ← TOO LATE

New flow:
  1. Create presentation record
  2. Upload photos (parallel)
  3. Generate presentation sections
  4. setGenerationDone(true)              ← IMMEDIATE
  5. Market analysis runs async (fire-and-forget)
     - Deep scrape portals
     - Save comparables
     - Calculate adjustments
     - Generate AI summary
     - Update pricing_scenarios section in DB
```

The market analysis results will still be saved to the database. When the user opens the editor, the sections will already have the market data if the background task finished, or will show placeholder data that can be refreshed.

### Additional fix in `StepGeneration.tsx`
- Wrap `onAnimationDone` callback dependency properly to avoid stale closure issues
- The current code works but `onAnimationDone` is not memoized in the parent — add `useCallback` in `AgentNewPresentation` for `handleAnimationDone`

## Result
- Loading screen completes in ~6-8 seconds (animation + section generation)
- Market analysis continues in background without blocking the user
- No more "stuck" loading screens

