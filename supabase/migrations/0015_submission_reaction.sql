-- ===========================================================================
-- 0015_submission_reaction
-- Teacher reaction (emoji) on a student's exercise submission.
-- ===========================================================================

alter table public.material_item_submissions add column if not exists reaction text;
