-- ===========================================================================
-- 0033_item_vocab
-- Optional "new words" list attached to an exercise: [{term, translation}, …].
-- Shown to the student in a green panel beside the exercise.
-- ===========================================================================

alter table public.material_items add column if not exists vocab jsonb;
