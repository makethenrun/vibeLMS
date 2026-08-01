-- ===========================================================================
-- 0013_sentence_task_item_type
-- Add SENTENCE_TASK: sentence work (word order, sort into columns, sentence
-- order, build word from letters, match pairs). The old MATCH type stays in the
-- enum for backward compatibility but is no longer offered as a standalone
-- format — "match pairs" becomes a SENTENCE_TASK variant.
-- ===========================================================================

alter table public.material_items drop constraint if exists material_items_type_check;

alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO','VIDEO','IMAGE','CAROUSEL','LINK','IMAGE_TASK','SENTENCE_TASK'));
