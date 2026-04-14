---
name: Market Study Architecture (Final)
description: Consolidated architecture — market_studies is the sole official flow
type: feature
---

## Official Flow (market_studies)

All new presentations use this flow:
- `market_studies` → study container (broker_id, tenant_id, status)
- `market_study_subject_properties` → the property being evaluated
- `market_study_comparables` → comparables (origin: manual|auto, raw_listing_id links to raw_listings)
- `market_study_results` → pricing output (avg, median, suggested prices)
- `market_study_executions` → audit trail per portal search
- `market_study_raw_listings` → raw scraped data per execution
- `market_study_adjustments` → per-comparable price adjustments
- `market_study_settings` → tenant-level weights and filters

`presentations.market_study_id` links a presentation to its study.

## Legacy Tables (READ-ONLY — do not delete)

These tables remain in the database for historical data from pre-migration presentations:
- `market_analysis_jobs` — old job container (linked via presentation_id)
- `market_comparables` — old comparables (linked via market_analysis_job_id)
- `market_reports` — old pricing reports (linked via market_analysis_job_id)

**No code writes to these tables.** Read-only fallback exists in:
- `useGeneratePresentation.ts` → fetchMarketData() else branch
- `generate-presentation-text/index.ts` → else branch after market_study_id check

Both marked with `// LEGACY COMPAT (read-only)`.

## Deleted Legacy Pages

- `AgentMarketStudy.tsx` — removed (was @deprecated)
- `MarketStudyDetail.tsx` — removed (was @deprecated)

Legacy routes `/market-study` and `/market-study/:id` redirect to `/market-studies`.

## Official Routes

- `/market-studies` → MarketStudies.tsx (list)
- `/market-studies/:id` → MarketStudyResult.tsx (detail)

## Traceability

Already sufficient via:
- `market_study_executions` (portal, status, counts, error)
- `market_study_raw_listings` (raw data per portal/execution)
- `market_study_comparables.origin` (manual vs auto)
- `market_study_comparables.raw_listing_id` (link to raw listing)

## seed-demo

Uses the official flow: creates market_studies, subject_properties, comparables, results.
Sets `presentations.market_study_id`.
