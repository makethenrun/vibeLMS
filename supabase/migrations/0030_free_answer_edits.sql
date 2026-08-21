-- ===========================================================================
-- 0030_free_answer_edits
-- Tutor/assistant corrections to a student's free-text answer. The student can
-- toggle between the original ("до изменений") and this edited version.
-- ===========================================================================

alter table public.material_item_submissions add column if not exists edited_answer text;
