-- ============================================
-- SUPABASE MIGRATION: Add event_id + UPDATE policy
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Add event_id column for future event filtering
ALTER TABLE public.gallery 
ADD COLUMN IF NOT EXISTS event_id TEXT;

CREATE INDEX IF NOT EXISTS gallery_event_id_idx ON public.gallery (event_id);

-- Add missing UPDATE policy (required for caption updates)
CREATE POLICY "Anyone can update gallery" 
  ON public.gallery 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);
