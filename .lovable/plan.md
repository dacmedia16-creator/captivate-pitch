

# Fix: Inngest v4 — `trigger` → `triggers` (plural)

## Problem
The error "Cannot read properties of undefined (reading 'triggers')" occurs because Inngest v4 expects `triggers` (plural) in the `createFunction` options, but our code uses `trigger` (singular).

From the [v4 migration guide](https://www.inngest.com/docs/reference/typescript/v4/migrations/v3-to-v4):
```typescript
// v4 correct syntax
inngest.createFunction(
  { id: "fn-id", triggers: { event: "fn/trigger-event" } },  // "triggers" not "trigger"
  async ({ event }) => { ... }
);
```

## Fix (single file)

**`supabase/functions/inngest-serve/index.ts` — line 670**

```typescript
// FROM:
{ id: "market-study-analyze", retries: 2, trigger: { event: "market-study/analyze.requested" } },

// TO:
{ id: "market-study-analyze", retries: 2, triggers: [{ event: "market-study/analyze.requested" }] },
```

One-character fix (`trigger` → `triggers` + wrap in array). Then redeploy and re-sync from Inngest dashboard.

