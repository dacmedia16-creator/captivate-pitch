ALTER TABLE public.market_study_results
ADD COLUMN IF NOT EXISTS research_metadata jsonb DEFAULT NULL;