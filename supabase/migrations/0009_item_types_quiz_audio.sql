-- ===========================================================================
-- 0009_item_types_quiz_audio
-- Replace the CHOICE item type with QUIZ (multi-question test, like homework)
-- and add AUDIO (listening: audio + questions).
--
-- Any pre-existing items of a now-removed type (e.g. CHOICE test data) are
-- deleted first, otherwise the new CHECK constraint would be violated.
-- ===========================================================================

-- Drop leftover items whose type is no longer valid (old CHOICE test data).
delete from public.material_items
where type not in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO');

alter table public.material_items drop constraint if exists material_items_type_check;

alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO'));
