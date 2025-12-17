-- Add publisher and school_name columns to problems table
ALTER TABLE IF EXISTS public.problems
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS school_name text;

