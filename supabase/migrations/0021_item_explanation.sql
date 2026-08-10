-- ===========================================================================
-- 0021_item_explanation
-- Optional explanation shown to the student after a wrong answer (score < 100).
-- ===========================================================================

alter table public.material_items add column if not exists explanation text;
