-- ===========================================================================
-- 0009_item_types_quiz_audio
-- Replace the CHOICE item type with QUIZ (multi-question test, like homework)
-- and add AUDIO (listening: audio + questions). Constructor data is empty, so
-- simply swapping the check constraint is safe.
-- ===========================================================================

alter table public.material_items drop constraint if exists material_items_type_check;

alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO'));
